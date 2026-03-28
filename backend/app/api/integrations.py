import hashlib
import hmac
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.models.integrations import GitHubPRAnalysis
from app.models.user import User
from app.schemas.integrations import (
    GitHubPRAnalysisResponse,
    GitHubPRCommentRequest,
)
from app.services.integrations_service import upsert_github_pr_analysis
from app.services.github_service import GitHubService

router = APIRouter(prefix="/integrations/github", tags=["integrations"])
settings = get_settings()


def _verify_github_signature(secret: str, body: bytes, signature_256: str | None) -> bool:
    if not signature_256:
        return False
    digest = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={digest}", signature_256)


@router.post("/webhook", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(f"{settings.webhook_rate_limit_per_minute}/minute")
async def github_webhook(request: Request, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    body = await request.body()
    if not settings.github_webhook_secret:
        raise HTTPException(status_code=503, detail="GitHub webhook secret is not configured")
    if not _verify_github_signature(
        settings.github_webhook_secret,
        body,
        request.headers.get("x-hub-signature-256"),
    ):
        raise HTTPException(status_code=401, detail="Invalid GitHub webhook signature")

    payload = await request.json()
    action = payload.get("action", "unknown")
    pull_request = payload.get("pull_request") or {}
    repository = payload.get("repository") or {}
    installation_id = ((payload.get("installation") or {}).get("id"))
    owner = ((repository.get("owner") or {}).get("login")) or payload.get("organization", {}).get("login")
    repo = repository.get("name")
    pr_number = pull_request.get("number")
    if not owner or not repo or not pr_number:
        return {"status": "ignored", "reason": "not_pr_event"}

    if action not in {"opened", "synchronize", "reopened"}:
        await upsert_github_pr_analysis(
            db,
            owner=owner,
            repo=repo,
            pr_number=int(pr_number),
            installation_id=installation_id,
            action=action,
            status="ignored",
            head_sha=(pull_request.get("head") or {}).get("sha"),
            summary=f"PR event ignored: {action}",
            result_payload={"action": action},
        )
        return {"status": "ignored", "reason": f"action_{action}"}

    pr_context = await GitHubService.fetch_pull_request_files(
        owner=owner,
        repo=repo,
        pr_number=int(pr_number),
        installation_id=installation_id,
    )
    changed_files = pr_context.get("changed_files") or pull_request.get("changed_files")
    additions = pull_request.get("additions")
    deletions = pull_request.get("deletions")
    top_files = sorted(
        pr_context.get("files", []),
        key=lambda f: int(f.get("changes", 0)),
        reverse=True,
    )[:5]
    hot_files = [f"{f.get('filename')} ({f.get('changes', 0)} lines)" for f in top_files]
    summary = (
        f"PR #{pr_number}: {changed_files or 0} files changed, "
        f"+{additions or 0}/-{deletions or 0} lines. "
        f"Hot files: {', '.join(hot_files) if hot_files else 'n/a'}"
    )
    record = await upsert_github_pr_analysis(
        db,
        owner=owner,
        repo=repo,
        pr_number=int(pr_number),
        installation_id=installation_id,
        action=action,
        status="completed",
        head_sha=(pull_request.get("head") or {}).get("sha"),
        summary=summary,
        result_payload={
            "title": pr_context.get("title") or pull_request.get("title"),
            "url": pr_context.get("url") or pull_request.get("html_url"),
            "changed_files": changed_files,
            "additions": additions,
            "deletions": deletions,
            "files": pr_context.get("files", []),
        },
    )
    return {"status": "accepted", "analysis_id": record.id}


@router.get(
    "/pr-analyses/{owner}/{repo}/{pr_number}",
    response_model=GitHubPRAnalysisResponse,
)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def get_pr_analysis(
    request: Request,
    owner: str,
    repo: str,
    pr_number: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GitHubPRAnalysis:
    _ = current_user
    result = await db.execute(
        select(GitHubPRAnalysis).where(
            GitHubPRAnalysis.owner == owner,
            GitHubPRAnalysis.repo == repo,
            GitHubPRAnalysis.pr_number == pr_number,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="PR analysis not found")
    return record


@router.post("/pr-analyses/{owner}/{repo}/{pr_number}/comment")
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def post_pr_comment(
    request: Request,
    owner: str,
    repo: str,
    pr_number: int,
    comment: GitHubPRCommentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    _ = current_user
    result = await db.execute(
        select(GitHubPRAnalysis).where(
            GitHubPRAnalysis.owner == owner,
            GitHubPRAnalysis.repo == repo,
            GitHubPRAnalysis.pr_number == pr_number,
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="PR analysis not found")

    body = comment.body or record.summary or "CodeXplain analysis completed."
    if comment.dry_run:
        return {
            "owner": owner,
            "repo": repo,
            "pr_number": pr_number,
            "dry_run": True,
            "published": False,
            "body": body,
            "note": "Dry-run mode does not call GitHub API.",
        }
    publish = await GitHubService.post_pr_comment(
        owner=owner,
        repo=repo,
        pr_number=pr_number,
        body=body,
        installation_id=record.installation_id,
    )
    return {
        "owner": owner,
        "repo": repo,
        "pr_number": pr_number,
        "dry_run": False,
        "published": bool(publish.get("published")),
        "body": body,
        "note": "Comment published." if publish.get("published") else f"Failed to publish: {publish.get('error', 'unknown error')}",
        "comment_url": publish.get("url"),
    }
