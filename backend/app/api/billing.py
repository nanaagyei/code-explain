import asyncio
from datetime import datetime, timezone
from typing import List

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.models.billing import CreditTransaction, UserCreditWallet
from app.models.user import User
from app.schemas.billing import (
    BillingSummaryResponse,
    CreditPackResponse,
    CreditTransactionResponse,
    CreateCheckoutSessionRequest,
    StripeCheckoutSessionResponse,
)
from app.services.billing_service import BillingService


router = APIRouter(prefix="/billing", tags=["billing"])
settings = get_settings()


def _epoch_to_datetime(epoch: int) -> datetime:
    return datetime.fromtimestamp(epoch, tz=timezone.utc)


@router.get("/packs", response_model=List[CreditPackResponse])
async def list_credit_packs(db: AsyncSession = Depends(get_db)):
    billing = BillingService(db)
    await billing.seed_default_packs()
    packs = await billing.list_active_credit_packs()
    return packs


@router.get("/wallet", response_model=BillingSummaryResponse)
async def get_wallet_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    billing = BillingService(db)
    wallet = await billing.get_or_create_wallet(current_user.id)
    has_api_key = await billing.user_has_personal_api_key(current_user.id)

    return BillingSummaryResponse(
        wallet=wallet,
        tokens_per_credit=billing.settings.billing_tokens_per_credit,
        estimated_token_cost_per_credit=(
            billing.settings.billing_estimated_cost_per_credit_cents / 100
        ),
        has_user_provided_api_key=has_api_key,
    )


@router.get("/transactions", response_model=List[CreditTransactionResponse])
async def list_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wallet_query = select(UserCreditWallet.id).where(UserCreditWallet.user_id == current_user.id)
    wallet_result = await db.execute(wallet_query)
    wallet_id = wallet_result.scalar_one_or_none()
    if not wallet_id:
        return []

    result = await db.execute(
        select(CreditTransaction)
        .where(CreditTransaction.wallet_id == wallet_id)
        .order_by(CreditTransaction.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.post("/checkout", response_model=StripeCheckoutSessionResponse)
async def create_checkout_session(
    payload: CreateCheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured for this deployment.",
        )

    billing = BillingService(db)
    pack = await billing.get_credit_pack(payload.credit_pack_id)
    if not pack or not pack.is_active:
        raise HTTPException(status_code=404, detail="Credit pack not found")

    stripe.api_key = settings.stripe_secret_key

    metadata = {
        "user_id": str(current_user.id),
        "credit_pack_id": str(pack.id),
    }

    def _create_session():
        line_item: dict
        if pack.stripe_price_id:
            line_item = {"price": pack.stripe_price_id, "quantity": 1}
        else:
            line_item = {
                "price_data": {
                    "currency": pack.currency,
                    "unit_amount": pack.price_cents,
                    "product_data": {
                        "name": f"{pack.name} Credits",
                        "description": pack.description or "",
                    },
                },
                "quantity": 1,
            }

        return stripe.checkout.Session.create(
            success_url=f"{settings.stripe_checkout_success_url}?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=settings.stripe_checkout_cancel_url,
            mode="payment",
            metadata=metadata,
            line_items=[line_item],
            payment_method_types=["card"],
        )

    try:
        checkout_session = await asyncio.to_thread(_create_session)
    except stripe.error.StripeError as exc:  # type: ignore[attr-defined]
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Stripe error: {exc.user_message or str(exc)}",
        ) from exc

    expires_at = _epoch_to_datetime(checkout_session.expires_at)
    await billing.record_checkout_session(
        user_id=current_user.id,
        credit_pack_id=pack.id,
        stripe_session_id=checkout_session.id,
        url=checkout_session.url,
        amount_total=checkout_session.amount_subtotal
        if hasattr(checkout_session, "amount_subtotal")
        else pack.price_cents,
        currency=pack.currency,
        expires_at=expires_at,
    )

    return StripeCheckoutSessionResponse(
        session_id=checkout_session.id,
        url=checkout_session.url,
        expires_at=expires_at,
        amount_total=checkout_session.amount_total
        if hasattr(checkout_session, "amount_total")
        else pack.price_cents,
        currency=pack.currency,
        status=checkout_session.status,
    )


@router.post("/stripe/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    if not settings.stripe_webhook_secret or not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe webhooks are not configured for this deployment.",
        )

    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(
            payload.decode("utf-8"),
            sig_header,
            settings.stripe_webhook_secret,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid payload") from exc
    except stripe.error.SignatureVerificationError as exc:  # type: ignore[attr-defined]
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    billing = BillingService(db)

    if event["type"] == "checkout.session.completed":
        session_obj = event["data"]["object"]
        metadata = session_obj.get("metadata", {}) or {}
        user_id = metadata.get("user_id")
        pack_id = metadata.get("credit_pack_id")

        stored_session, updated = await billing.mark_checkout_completed(
            stripe_session_id=session_obj["id"],
            payment_intent_id=session_obj.get("payment_intent"),
            raw_payload=session_obj,
        )

        if updated and user_id and pack_id:
            try:
                user_id_int = int(user_id)
                pack_id_int = int(pack_id)
            except (TypeError, ValueError):
                user_id_int = None
                pack_id_int = None

            if user_id_int and pack_id_int:
                pack = await billing.get_credit_pack(pack_id_int)
                if pack:
                    await billing.deposit_credits(
                        user_id=user_id_int,
                        credits=pack.credits,
                        description=f"Stripe purchase - {pack.name}",
                        source="stripe_checkout",
                        extra_metadata={
                            "stripe_session_id": session_obj["id"],
                            "payment_intent": session_obj.get("payment_intent"),
                        },
                    )

    return JSONResponse({"received": True})

