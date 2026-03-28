import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.integrations import (
    CollaborationNote,
    CollaborationSession,
    GitHubPRAnalysis,
    OutboundWebhookDelivery,
    OutboundWebhookEndpoint,
    QualityMetricSnapshot,
    QualityProfile,
)
from app.models.repository import CodeFile, Repository

settings = get_settings()


def get_default_quality_weights() -> dict[str, float]:
    return {
        "readability": settings.default_weight_readability,
        "maintainability": settings.default_weight_maintainability,
        "security": settings.default_weight_security,
        "performance": settings.default_weight_performance,
        "testability": settings.default_weight_testability,
    }


def normalize_weights(weights: dict[str, float]) -> dict[str, float]:
    total = sum(weights.values())
    if total <= 0:
        return get_default_quality_weights()
    return {k: v / total for k, v in weights.items()}


async def get_or_create_quality_profile(db: AsyncSession, user_id: int) -> QualityProfile:
    result = await db.execute(select(QualityProfile).where(QualityProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if profile:
        return profile
    profile = QualityProfile(user_id=user_id, weights=get_default_quality_weights())
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def save_quality_snapshot(
    db: AsyncSession,
    *,
    user_id: int,
    repository_id: int,
    code_file_id: int,
    source: str,
    health_score: dict[str, Any],
) -> QualityMetricSnapshot:
    snapshot = QualityMetricSnapshot(
        user_id=user_id,
        repository_id=repository_id,
        code_file_id=code_file_id,
        source=source,
        health_score=health_score,
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


async def get_quality_history(
    db: AsyncSession, *, user_id: int, repository_id: int, limit: int = 200
) -> list[QualityMetricSnapshot]:
    result = await db.execute(
        select(QualityMetricSnapshot)
        .where(
            QualityMetricSnapshot.user_id == user_id,
            QualityMetricSnapshot.repository_id == repository_id,
        )
        .order_by(QualityMetricSnapshot.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def upsert_github_pr_analysis(
    db: AsyncSession,
    *,
    owner: str,
    repo: str,
    pr_number: int,
    installation_id: int | None,
    action: str,
    status: str,
    head_sha: str | None = None,
    summary: str | None = None,
    result_payload: dict[str, Any] | None = None,
    last_error: str | None = None,
) -> GitHubPRAnalysis:
    result = await db.execute(
        select(GitHubPRAnalysis).where(
            GitHubPRAnalysis.owner == owner,
            GitHubPRAnalysis.repo == repo,
            GitHubPRAnalysis.pr_number == pr_number,
        )
    )
    record = result.scalar_one_or_none()
    if record is None:
        record = GitHubPRAnalysis(
            owner=owner,
            repo=repo,
            pr_number=pr_number,
            installation_id=installation_id,
            action=action,
            status=status,
            head_sha=head_sha,
            summary=summary,
            result_payload=result_payload,
            last_error=last_error,
        )
        db.add(record)
    else:
        record.action = action
        record.installation_id = installation_id
        record.status = status
        record.head_sha = head_sha
        record.summary = summary
        record.result_payload = result_payload
        record.last_error = last_error
    await db.commit()
    await db.refresh(record)
    return record


def build_webhook_signature(secret: str, payload: dict[str, Any]) -> str:
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    digest = hmac.new(secret.encode("utf-8"), payload_json, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


async def enqueue_webhook_deliveries(
    db: AsyncSession, *, user_id: int, event_name: str, payload: dict[str, Any]
) -> list[OutboundWebhookDelivery]:
    endpoint_result = await db.execute(
        select(OutboundWebhookEndpoint).where(
            OutboundWebhookEndpoint.user_id == user_id,
            OutboundWebhookEndpoint.is_active.is_(True),
        )
    )
    endpoints = [
        e for e in endpoint_result.scalars().all() if event_name in (e.events or [])
    ]
    deliveries: list[OutboundWebhookDelivery] = []
    for endpoint in endpoints:
        delivery = OutboundWebhookDelivery(
            endpoint_id=endpoint.id,
            event_name=event_name,
            payload=payload,
            status="queued",
            next_attempt_at=datetime.now(timezone.utc),
        )
        db.add(delivery)
        deliveries.append(delivery)
    await db.commit()
    for delivery in deliveries:
        await db.refresh(delivery)
    return deliveries


async def process_webhook_delivery(
    db: AsyncSession, delivery: OutboundWebhookDelivery
) -> OutboundWebhookDelivery:
    endpoint = await db.get(OutboundWebhookEndpoint, delivery.endpoint_id)
    if not endpoint or not endpoint.is_active:
        delivery.status = "dead_letter"
        delivery.last_error = "Endpoint missing or inactive"
        await db.commit()
        await db.refresh(delivery)
        return delivery

    try:
        signature = build_webhook_signature(endpoint.secret, delivery.payload)
        headers = {
            "Content-Type": "application/json",
            "X-CodeXplain-Event": delivery.event_name,
            "X-CodeXplain-Signature": signature,
        }
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(endpoint.url, json=delivery.payload, headers=headers)
        delivery.attempt_count += 1
        delivery.last_status_code = response.status_code
        if 200 <= response.status_code < 300:
            delivery.status = "delivered"
            delivery.delivered_at = datetime.now(timezone.utc)
            delivery.last_error = None
        else:
            _mark_delivery_retry(delivery, f"Non-2xx response: {response.status_code}")
    except Exception as exc:
        delivery.attempt_count += 1
        _mark_delivery_retry(delivery, str(exc))

    await db.commit()
    await db.refresh(delivery)
    return delivery


def _mark_delivery_retry(delivery: OutboundWebhookDelivery, error: str) -> None:
    delivery.last_error = error
    if delivery.attempt_count >= settings.webhook_max_attempts:
        delivery.status = "dead_letter"
        delivery.next_attempt_at = None
        return
    delay_minutes = min(2 ** max(delivery.attempt_count - 1, 0), 32)
    delivery.status = "retrying"
    delivery.next_attempt_at = datetime.now(timezone.utc) + timedelta(minutes=delay_minutes)


async def process_due_webhook_deliveries(db: AsyncSession, limit: int = 25) -> list[OutboundWebhookDelivery]:
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(OutboundWebhookDelivery)
        .where(
            OutboundWebhookDelivery.status.in_(["queued", "retrying"]),
            OutboundWebhookDelivery.next_attempt_at.is_not(None),
            OutboundWebhookDelivery.next_attempt_at <= now,
        )
        .order_by(OutboundWebhookDelivery.created_at.asc())
        .limit(limit)
    )
    deliveries = list(result.scalars().all())
    processed: list[OutboundWebhookDelivery] = []
    for delivery in deliveries:
        processed.append(await process_webhook_delivery(db, delivery))
    return processed


async def create_collaboration_session(
    db: AsyncSession,
    *,
    user_id: int,
    repository_id: int,
    title: str,
    saved_exploration_id: int | None = None,
) -> CollaborationSession:
    session = CollaborationSession(
        user_id=user_id,
        repository_id=repository_id,
        title=title,
        saved_exploration_id=saved_exploration_id,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def add_collaboration_note(
    db: AsyncSession, *, session_id: int, user_id: int, content: str
) -> CollaborationNote:
    note = CollaborationNote(session_id=session_id, user_id=user_id, content=content)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


async def get_collaboration_notes(
    db: AsyncSession, *, session_id: int, limit: int = 200
) -> list[CollaborationNote]:
    result = await db.execute(
        select(CollaborationNote)
        .where(CollaborationNote.session_id == session_id)
        .order_by(CollaborationNote.created_at.asc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def analytics_overview(db: AsyncSession, user_id: int) -> dict[str, Any]:
    repos_total = (
        await db.execute(select(func.count(Repository.id)).where(Repository.user_id == user_id))
    ).scalar_one()
    completed_repos = (
        await db.execute(
            select(func.count(Repository.id)).where(
                Repository.user_id == user_id, Repository.status == "completed"
            )
        )
    ).scalar_one()
    files_total = (
        await db.execute(
            select(func.count(CodeFile.id))
            .join(Repository, Repository.id == CodeFile.repository_id)
            .where(Repository.user_id == user_id)
        )
    ).scalar_one()
    snapshots = (
        await db.execute(
            select(QualityMetricSnapshot).where(QualityMetricSnapshot.user_id == user_id)
        )
    ).scalars().all()
    if snapshots:
        avg = sum((s.health_score or {}).get("score", 0) for s in snapshots) / len(snapshots)
    else:
        avg = 0.0
    usage = (
        await db.execute(
            select(
                func.coalesce(func.sum(Repository.total_tokens_used), 0),
                func.coalesce(func.sum(Repository.total_credits_charged), 0),
            ).where(Repository.user_id == user_id)
        )
    ).one()
    return {
        "repositories_total": int(repos_total or 0),
        "completed_repositories": int(completed_repos or 0),
        "files_total": int(files_total or 0),
        "average_health_score": round(float(avg), 2),
        "total_tokens_used": int(usage[0] or 0),
        "total_credits_charged": int(usage[1] or 0),
    }
