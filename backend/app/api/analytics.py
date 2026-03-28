from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.models.integrations import QualityMetricSnapshot
from app.models.user import User
from app.schemas.integrations import (
    AnalyticsOverviewResponse,
    AnalyticsTrendsResponse,
    RepositoryBenchmarksResponse,
    RepositoryBenchmarkItem,
)
from app.services.integrations_service import analytics_overview

router = APIRouter(prefix="/analytics", tags=["analytics"])
settings = get_settings()


@router.get("/overview", response_model=AnalyticsOverviewResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def get_overview(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await analytics_overview(db, current_user.id)


@router.get("/quality-trends", response_model=AnalyticsTrendsResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def get_quality_trends(
    request: Request,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=max(1, min(days, 365)))
    result = await db.execute(
        select(QualityMetricSnapshot).where(
            QualityMetricSnapshot.user_id == current_user.id,
            QualityMetricSnapshot.created_at >= since,
        )
    )
    snapshots = list(result.scalars().all())
    buckets: dict[str, list[float]] = defaultdict(list)
    for item in snapshots:
        key = item.created_at.date().isoformat()
        buckets[key].append(float((item.health_score or {}).get("score", 0)))
    points = []
    for day_key in sorted(buckets.keys()):
        vals = buckets[day_key]
        points.append(
            {"date": day_key, "average_score": round(sum(vals) / max(len(vals), 1), 2), "snapshots": len(vals)}
        )
    return {"days": days, "points": points}


@router.get("/repository-benchmarks", response_model=RepositoryBenchmarksResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def get_repository_benchmarks(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(QualityMetricSnapshot).where(QualityMetricSnapshot.user_id == current_user.id)
    )
    snapshots = list(result.scalars().all())
    grouped: dict[int, list[QualityMetricSnapshot]] = defaultdict(list)
    for item in snapshots:
        grouped[item.repository_id].append(item)

    items: list[RepositoryBenchmarkItem] = []
    for repository_id, rows in grouped.items():
        sorted_rows = sorted(rows, key=lambda r: r.created_at)
        scores = [float((r.health_score or {}).get("score", 0)) for r in sorted_rows]
        repo_name = ""
        if sorted_rows and sorted_rows[0].repository:
            repo_name = sorted_rows[0].repository.name
        items.append(
            RepositoryBenchmarkItem(
                repository_id=repository_id,
                repository_name=repo_name or f"Repository {repository_id}",
                average_score=round(sum(scores) / max(len(scores), 1), 2),
                latest_score=round(scores[-1], 2) if scores else None,
                snapshots=len(rows),
            )
        )
    items.sort(key=lambda x: x.average_score, reverse=True)
    return {"items": items}
