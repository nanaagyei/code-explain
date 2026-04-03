import math
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models.billing import (
    UserCreditWallet,
    CreditTransaction,
    CreditPack,
    StripeCheckoutSession,
)
from app.models.user import User


class BillingError(Exception):
    """Base billing exception."""


class InsufficientCreditsError(BillingError):
    """Raised when a wallet cannot cover a charge."""

    def __init__(self, missing_credits: int):
        super().__init__("Insufficient credits to process this request.")
        self.missing_credits = missing_credits


class BillingService:
    """Utility service that encapsulates wallet/accounting logic."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()
        self._default_packs = [
            {
                "name": "Starter",
                "description": "Great for trying out AI features",
                "credits": 200,
                "price_cents": 300,
                "sort_order": 1,
            },
            {
                "name": "Builder",
                "description": "Enough credits for small teams",
                "credits": 1000,
                "price_cents": 1400,
                "sort_order": 2,
            },
            {
                "name": "Pro",
                "description": "Best value for power users",
                "credits": 5000,
                "price_cents": 6000,
                "sort_order": 3,
            },
        ]

    # ------------------------------------------------------------------
    # Wallet helpers
    # ------------------------------------------------------------------
    async def get_or_create_wallet(self, user_id: int) -> UserCreditWallet:
        result = await self.db.execute(
            select(UserCreditWallet)
            .where(UserCreditWallet.user_id == user_id)
            .options(selectinload(UserCreditWallet.transactions))
        )
        wallet = result.scalar_one_or_none()
        if wallet:
            return wallet

        wallet = UserCreditWallet(user_id=user_id)
        self.db.add(wallet)
        await self.db.commit()
        await self.db.refresh(wallet)
        return wallet

    async def get_wallet_summary(self, user_id: int) -> UserCreditWallet | None:
        result = await self.db.execute(
            select(UserCreditWallet).where(UserCreditWallet.user_id == user_id)
        )
        return result.scalar_one_or_none()

    # ------------------------------------------------------------------
    # Credit conversion helpers
    # ------------------------------------------------------------------
    def tokens_to_credits(self, tokens_used: int) -> int:
        """Convert OpenAI tokens to billable credits."""
        if tokens_used <= 0:
            return 0

        tokens_per_credit = max(1, self.settings.billing_tokens_per_credit)
        return math.ceil(tokens_used / tokens_per_credit)

    def estimate_token_cost_usd(self, tokens_used: int) -> float:
        """
        Estimate USD cost for a token charge using the configured credit conversion rate.
        """
        credits = self.tokens_to_credits(tokens_used)
        cents_per_credit = max(1, self.settings.billing_estimated_cost_per_credit_cents)
        usd = (credits * cents_per_credit) / 100
        return round(usd, 4)

    # ------------------------------------------------------------------
    # Ledger operations
    # ------------------------------------------------------------------
    async def deposit_credits(
        self,
        user_id: int,
        credits: int,
        description: str,
        source: str = "stripe",
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> CreditTransaction:
        if credits <= 0:
            raise BillingError("Credits to deposit must be greater than zero.")

        wallet = await self.get_or_create_wallet(user_id)
        wallet.balance_credits += credits
        wallet.lifetime_credits_purchased += credits
        wallet.updated_at = datetime.utcnow()

        transaction = CreditTransaction(
            wallet_id=wallet.id,
            transaction_type="deposit",
            credits_delta=credits,
            balance_after=wallet.balance_credits,
            description=description,
            source=source,
            extra_metadata=extra_metadata,
        )
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(wallet)
        await self.db.refresh(transaction)
        return transaction

    async def debit_credits(
        self,
        user_id: int,
        credits: int,
        tokens: int,
        description: str,
        source: str,
        repository_id: Optional[int] = None,
        code_file_id: Optional[int] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> CreditTransaction:
        if credits <= 0:
            return None

        wallet = await self.get_or_create_wallet(user_id)
        if wallet.balance_credits < credits:
            raise InsufficientCreditsError(credits - wallet.balance_credits)

        wallet.balance_credits -= credits
        wallet.lifetime_credits_spent += credits
        wallet.updated_at = datetime.utcnow()

        transaction = CreditTransaction(
            wallet_id=wallet.id,
            transaction_type="debit",
            credits_delta=-credits,
            balance_after=wallet.balance_credits,
            tokens=tokens,
            description=description,
            source=source,
            repository_id=repository_id,
            code_file_id=code_file_id,
            extra_metadata=extra_metadata,
        )

        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(wallet)
        await self.db.refresh(transaction)
        return transaction

    # ------------------------------------------------------------------
    # Credit packs & checkout helpers
    # ------------------------------------------------------------------
    async def list_active_credit_packs(self) -> list[CreditPack]:
        result = await self.db.execute(
            select(CreditPack)
            .where(CreditPack.is_active == True)  # noqa: E712
            .order_by(CreditPack.sort_order.asc(), CreditPack.credits.asc())
        )
        return result.scalars().all()

    async def get_credit_pack(self, pack_id: int) -> Optional[CreditPack]:
        result = await self.db.execute(
            select(CreditPack).where(CreditPack.id == pack_id)
        )
        return result.scalar_one_or_none()

    async def record_checkout_session(
        self,
        user_id: int,
        credit_pack_id: int,
        stripe_session_id: str,
        url: str,
        amount_total: int,
        currency: str,
        expires_at: datetime,
    ) -> StripeCheckoutSession:
        session = StripeCheckoutSession(
            user_id=user_id,
            credit_pack_id=credit_pack_id,
            stripe_session_id=stripe_session_id,
            status="created",
            amount_total=amount_total,
            currency=currency,
            url=url,
            expires_at=expires_at,
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def seed_default_packs(self) -> None:
        """Seed sensible default packs if table is empty."""
        result = await self.db.execute(select(CreditPack.id))
        existing = result.scalars().first()
        if existing:
            return

        for data in self._default_packs:
            pack = CreditPack(
                **data,
                currency="usd",
                stripe_price_id=None,
                is_active=True,
            )
            self.db.add(pack)
        await self.db.commit()

    async def mark_checkout_completed(
        self,
        stripe_session_id: str,
        payment_intent_id: Optional[str],
        raw_payload: Dict[str, Any],
    ) -> tuple[StripeCheckoutSession | None, bool]:
        result = await self.db.execute(
            select(StripeCheckoutSession).where(
                StripeCheckoutSession.stripe_session_id == stripe_session_id
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            return None, False

        if session.status == "completed":
            return session, False

        session.status = "completed"
        session.payment_intent_id = payment_intent_id
        session.completed_at = datetime.utcnow()
        session.raw_payload = raw_payload
        await self.db.commit()
        await self.db.refresh(session)
        return session, True

    # ------------------------------------------------------------------
    # Helper flags
    # ------------------------------------------------------------------
    async def user_has_personal_api_key(self, user_id: int) -> bool:
        result = await self.db.execute(
            select(User).where(User.id == user_id).options(selectinload(User.api_keys))
        )
        user = result.scalar_one_or_none()
        if not user:
            return False
        return any(key.is_active for key in user.api_keys)

