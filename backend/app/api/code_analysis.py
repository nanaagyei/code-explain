"""
API endpoints for AI-powered code analysis features.

Provides endpoints for:
- Code Review generation
- Quality Metrics calculation
- Architecture Diagram creation
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
import time

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.repository import Repository, CodeFile
from app.schemas.code_analysis import (
    CodeReviewResponse, HealthScoreResponse, ArchitectureDiagramResponse,
    QuickFileAnalysisRequest, QuickFileAnalysisResponse
)
from app.services.code_parser import CodeParser
from app.services.ai_service import AIDocumentationService
from app.services.code_analysis_service import get_code_analysis_service
from app.core.rate_limit import limiter
from app.core.config import get_settings
from app.schemas.integrations import (
    QualitySnapshotResponse,
    QualityAggregateResponse,
    QualityWeightsUpdate,
    QualityWeightsResponse,
)
from app.services.integrations_service import (
    get_or_create_quality_profile,
    normalize_weights,
    save_quality_snapshot,
    get_quality_history,
    enqueue_webhook_deliveries,
    process_due_webhook_deliveries,
)

router = APIRouter(prefix="/code-analysis", tags=["code-analysis"])
settings = get_settings()


@router.post("/repositories/{repo_id}/files/{file_id}/review", response_model=CodeReviewResponse)
@limiter.limit(f"{settings.analysis_rate_limit_per_minute}/minute")
async def generate_code_review(
    request: Request,
    repo_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate comprehensive code review for a specific file.
    
    Analyzes security vulnerabilities, performance issues, and best practices.
    Results are cached for 1 hour to optimize performance.
    """
    # Verify repository belongs to user
    repo_result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id
        )
    )
    repo = repo_result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get file
    file_result = await db.execute(
        select(CodeFile).where(
            CodeFile.id == file_id,
            CodeFile.repository_id == repo_id
        )
    )
    file = file_result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not file.original_content:
        raise HTTPException(status_code=400, detail="File content not available")
    
    try:
        start_time = time.time()
        
        # Get analysis service
        analysis_service = get_code_analysis_service()
        
        # Check if already cached in database
        if file.code_review:
            processing_time = time.time() - start_time
            return CodeReviewResponse(
                code_review=file.code_review,
                processing_time=processing_time,
                cached=True
            )
        
        # Generate code review
        code_review = await analysis_service.generate_code_review(
            code=file.original_content,
            language=file.language,
            file_path=file.file_path
        )
        
        # Update database
        file.code_review = code_review.dict()
        await db.commit()
        await db.refresh(file)
        await enqueue_webhook_deliveries(
            db,
            user_id=current_user.id,
            event_name="analysis.completed",
            payload={
                "event": "analysis.completed",
                "analysis_type": "code_review",
                "repository_id": repo_id,
                "file_id": file_id,
            },
        )
        await process_due_webhook_deliveries(db)
        
        processing_time = time.time() - start_time
        
        return CodeReviewResponse(
            code_review=code_review,
            processing_time=processing_time,
            cached=False
        )
        
    except Exception as e:
        print(f"Error generating code review: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate code review: {str(e)}"
        )


@router.post("/repositories/{repo_id}/files/{file_id}/quality", response_model=HealthScoreResponse)
@limiter.limit(f"{settings.analysis_rate_limit_per_minute}/minute")
async def calculate_quality_metrics(
    request: Request,
    repo_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate aggregate code health score.
    
    Evaluates maintainability, testability, readability, performance, and security,
    then returns a single health score with a detailed breakdown.
    Results are cached for 1 hour to optimize performance.
    """
    # Verify repository belongs to user
    repo_result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id
        )
    )
    repo = repo_result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get file
    file_result = await db.execute(
        select(CodeFile).where(
            CodeFile.id == file_id,
            CodeFile.repository_id == repo_id
        )
    )
    file = file_result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not file.original_content:
        raise HTTPException(status_code=400, detail="File content not available")
    
    try:
        start_time = time.time()
        
        # Get analysis service
        analysis_service = get_code_analysis_service()
        
        # Check if already cached in database
        if file.quality_metrics:
            processing_time = time.time() - start_time
            return HealthScoreResponse(
                health_score=file.quality_metrics,
                processing_time=processing_time,
                cached=True
            )
        
        # Calculate quality metrics
        health_score = await analysis_service.calculate_quality_metrics(
            code=file.original_content,
            language=file.language,
            file_path=file.file_path
        )
        profile = await get_or_create_quality_profile(db, current_user.id)
        health_score = analysis_service.apply_custom_weights(health_score, normalize_weights(profile.weights))
        
        # Update database
        file.quality_metrics = health_score.dict()
        await db.commit()
        await db.refresh(file)
        await save_quality_snapshot(
            db,
            user_id=current_user.id,
            repository_id=repo_id,
            code_file_id=file_id,
            source="file_quality_endpoint",
            health_score=health_score.dict(),
        )
        await enqueue_webhook_deliveries(
            db,
            user_id=current_user.id,
            event_name="analysis.completed",
            payload={
                "event": "analysis.completed",
                "analysis_type": "quality_metrics",
                "repository_id": repo_id,
                "file_id": file_id,
            },
        )
        await process_due_webhook_deliveries(db)
        
        processing_time = time.time() - start_time
        
        return HealthScoreResponse(
            health_score=health_score,
            processing_time=processing_time,
            cached=False
        )
        
    except Exception as e:
        print(f"Error calculating quality metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate quality metrics: {str(e)}"
        )


@router.post("/repositories/{repo_id}/files/{file_id}/architecture", response_model=ArchitectureDiagramResponse)
@limiter.limit(f"{settings.analysis_rate_limit_per_minute}/minute")
async def generate_architecture_diagram(
    request: Request,
    repo_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate interactive architecture diagram showing component relationships.
    
    Creates a graph structure with nodes and edges representing code components
    and their interactions. Results are cached for 1 hour.
    """
    # Verify repository belongs to user
    repo_result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id
        )
    )
    repo = repo_result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get file
    file_result = await db.execute(
        select(CodeFile).where(
            CodeFile.id == file_id,
            CodeFile.repository_id == repo_id
        )
    )
    file = file_result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not file.original_content:
        raise HTTPException(status_code=400, detail="File content not available")
    
    try:
        start_time = time.time()
        
        # Get analysis service
        analysis_service = get_code_analysis_service()
        
        # Check if already cached in database
        if file.architecture_data:
            processing_time = time.time() - start_time
            return ArchitectureDiagramResponse(
                architecture_diagram=file.architecture_data,
                processing_time=processing_time,
                cached=True
            )
        
        # Generate architecture diagram
        architecture_diagram = await analysis_service.generate_architecture_diagram(
            code=file.original_content,
            language=file.language,
            file_path=file.file_path
        )
        
        # Update database
        file.architecture_data = architecture_diagram.dict()
        await db.commit()
        await db.refresh(file)
        await enqueue_webhook_deliveries(
            db,
            user_id=current_user.id,
            event_name="analysis.completed",
            payload={
                "event": "analysis.completed",
                "analysis_type": "architecture_diagram",
                "repository_id": repo_id,
                "file_id": file_id,
            },
        )
        await process_due_webhook_deliveries(db)
        
        processing_time = time.time() - start_time
        
        return ArchitectureDiagramResponse(
            architecture_diagram=architecture_diagram,
            processing_time=processing_time,
            cached=False
        )
        
    except Exception as e:
        print(f"Error generating architecture diagram: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate architecture diagram: {str(e)}"
        )


@router.post("/quick-file", response_model=QuickFileAnalysisResponse)
@limiter.limit(f"{settings.analysis_rate_limit_per_minute}/minute")
async def quick_file_analysis(
    request: Request,
    payload: QuickFileAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze a standalone file for quick insights.

    Returns a concise summary and health score without storing data.
    """
    try:
        parser = CodeParser(payload.language)
        parsed_code = parser.parse(payload.code)

        ai_service = AIDocumentationService()
        summary_result = await ai_service.generate_file_summary(
            parsed_code,
            payload.code,
            payload.language,
            payload.file_path
        )

        analysis_service = get_code_analysis_service()
        tokens_before = analysis_service.total_tokens_used
        health_score = await analysis_service.calculate_quality_metrics(
            code=payload.code,
            language=payload.language,
            file_path=payload.file_path
        )
        profile_result = await get_or_create_quality_profile(db, current_user.id)
        health_score = analysis_service.apply_custom_weights(
            health_score,
            normalize_weights(profile_result.weights),
        )
        tokens_after = analysis_service.total_tokens_used
        tokens_used = summary_result.tokens_used + max(0, tokens_after - tokens_before)

        return QuickFileAnalysisResponse(
            summary=summary_result.content,
            health_score=health_score,
            tokens_used=tokens_used
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error running quick file analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze file: {str(e)}"
        )


@router.get(
    "/repositories/{repo_id}/quality/history",
    response_model=list[QualitySnapshotResponse],
)
@limiter.limit(f"{settings.analysis_rate_limit_per_minute}/minute")
async def quality_history(
    request: Request,
    repo_id: int,
    limit: int = 200,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id,
        )
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    snapshots = await get_quality_history(
        db, user_id=current_user.id, repository_id=repo_id, limit=max(1, min(limit, 1000))
    )
    return snapshots


@router.get(
    "/repositories/{repo_id}/quality/aggregate",
    response_model=QualityAggregateResponse,
)
@limiter.limit(f"{settings.analysis_rate_limit_per_minute}/minute")
async def quality_aggregate(
    request: Request,
    repo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id,
        )
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    snapshots = await get_quality_history(db, user_id=current_user.id, repository_id=repo_id, limit=1000)
    if not snapshots:
        return {
            "repository_id": repo_id,
            "total_snapshots": 0,
            "average_score": 0.0,
            "latest_score": None,
            "latest_grade": None,
            "metrics_average": {},
        }
    scores = [float((s.health_score or {}).get("score", 0)) for s in snapshots]
    latest = snapshots[0].health_score or {}
    metric_sums: dict[str, float] = {}
    metric_counts: dict[str, int] = {}
    for snap in snapshots:
        metrics = (snap.health_score or {}).get("metrics", {})
        for key, value in metrics.items():
            metric_sums[key] = metric_sums.get(key, 0.0) + float(value)
            metric_counts[key] = metric_counts.get(key, 0) + 1
    metric_avg = {
        key: round(metric_sums[key] / max(metric_counts.get(key, 1), 1), 2)
        for key in metric_sums
    }
    return {
        "repository_id": repo_id,
        "total_snapshots": len(snapshots),
        "average_score": round(sum(scores) / max(len(scores), 1), 2),
        "latest_score": latest.get("score"),
        "latest_grade": latest.get("grade"),
        "metrics_average": metric_avg,
    }


@router.put("/quality-profile", response_model=QualityWeightsResponse)
@limiter.limit(f"{settings.analysis_rate_limit_per_minute}/minute")
async def update_quality_profile(
    request: Request,
    payload: QualityWeightsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_or_create_quality_profile(db, current_user.id)
    weights = normalize_weights(payload.model_dump())
    profile.weights = weights
    await db.commit()
    await db.refresh(profile)
    return {"weights": profile.weights}


@router.post("/repository-overview")
@limiter.limit(f"{settings.analysis_rate_limit_per_minute}/minute")
async def repository_overview(
    request: Request,
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    _ = current_user
    files = payload.get("files") or []
    repo_name = payload.get("repo_name") or "Workspace"
    supported = [f for f in files if isinstance(f, dict) and f.get("content") and f.get("path")]
    if not supported:
        raise HTTPException(status_code=400, detail="No files provided")
    parser_stats = []
    for item in supported[:200]:
        language = item.get("language") or CodeParser.detect_language(item.get("path", ""))
        if not language:
            continue
        parser = CodeParser(language)
        parsed = parser.parse(item.get("content", ""))
        parser_stats.append(
            {
                "path": item["path"],
                "language": language,
                "functions": len(parsed.get("functions", [])),
                "classes": len(parsed.get("classes", [])),
                "complexity": parsed.get("complexity", 0),
            }
        )
    if not parser_stats:
        raise HTTPException(status_code=400, detail="No supported files provided")
    entry_points = sorted(parser_stats, key=lambda x: x["complexity"], reverse=True)[:5]
    avg_complexity = sum(x["complexity"] for x in parser_stats) / max(len(parser_stats), 1)
    return {
        "repo_name": repo_name,
        "files_analyzed": len(parser_stats),
        "average_complexity": round(avg_complexity, 2),
        "entry_points": entry_points,
        "summary": f"{repo_name}: analyzed {len(parser_stats)} files.",
    }


