from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.models.integrations import OutboundWebhookDelivery, OutboundWebhookEndpoint
from app.models.user import User
from app.schemas.integrations import (
    WebhookDeliveryResponse,
    WebhookEndpointCreate,
    WebhookEndpointResponse,
    WebhookEndpointUpdate,
)
from app.services.integrations_service import process_due_webhook_deliveries

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
settings = get_settings()


@router.post("/", response_model=WebhookEndpointResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(f"{settings.webhook_rate_limit_per_minute}/minute")
async def create_webhook_endpoint(
    request: Request,
    payload: WebhookEndpointCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OutboundWebhookEndpoint:
    endpoint = OutboundWebhookEndpoint(
        user_id=current_user.id,
        url=str(payload.url),
        events=payload.events,
        secret=payload.secret,
        is_active=payload.is_active,
    )
    db.add(endpoint)
    await db.commit()
    await db.refresh(endpoint)
    return endpoint


@router.get("/", response_model=list[WebhookEndpointResponse])
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def list_webhook_endpoints(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[OutboundWebhookEndpoint]:
    result = await db.execute(
        select(OutboundWebhookEndpoint).where(OutboundWebhookEndpoint.user_id == current_user.id)
    )
    return list(result.scalars().all())


@router.patch("/{endpoint_id}", response_model=WebhookEndpointResponse)
@limiter.limit(f"{settings.webhook_rate_limit_per_minute}/minute")
async def update_webhook_endpoint(
    request: Request,
    endpoint_id: int,
    payload: WebhookEndpointUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OutboundWebhookEndpoint:
    endpoint = await db.get(OutboundWebhookEndpoint, endpoint_id)
    if not endpoint or endpoint.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found")
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(endpoint, field, value)
    await db.commit()
    await db.refresh(endpoint)
    return endpoint


@router.delete("/{endpoint_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(f"{settings.webhook_rate_limit_per_minute}/minute")
async def delete_webhook_endpoint(
    request: Request,
    endpoint_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    endpoint = await db.get(OutboundWebhookEndpoint, endpoint_id)
    if not endpoint or endpoint.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found")
    await db.delete(endpoint)
    await db.commit()
    return None


@router.get("/deliveries", response_model=list[WebhookDeliveryResponse])
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def list_webhook_deliveries(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[OutboundWebhookDelivery]:
    result = await db.execute(
        select(OutboundWebhookDelivery)
        .join(
            OutboundWebhookEndpoint,
            OutboundWebhookEndpoint.id == OutboundWebhookDelivery.endpoint_id,
        )
        .where(OutboundWebhookEndpoint.user_id == current_user.id)
        .order_by(OutboundWebhookDelivery.created_at.desc())
        .limit(100)
    )
    return list(result.scalars().all())


@router.post("/deliveries/process")
@limiter.limit(f"{settings.webhook_rate_limit_per_minute}/minute")
async def process_webhook_queue(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    _ = current_user
    deliveries = await process_due_webhook_deliveries(db)
    return {"processed": len(deliveries)}
