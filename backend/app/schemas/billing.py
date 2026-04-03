from datetime import datetime
from typing import Optional, Any, Dict

from pydantic import BaseModel, ConfigDict, Field


class CreditPackResponse(BaseModel):
    """Schema describing an available credit pack."""

    id: int
    name: str
    description: Optional[str] = None
    credits: int
    price_cents: int
    currency: str = "usd"
    stripe_price_id: Optional[str] = None
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserCreditWalletResponse(BaseModel):
    """Schema summarizing a user's wallet balance."""

    id: int
    user_id: int
    balance_credits: int
    lifetime_credits_purchased: int
    lifetime_credits_spent: int
    last_recalculated_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CreditTransactionResponse(BaseModel):
    """Immutable ledger transaction."""

    id: int
    wallet_id: int
    transaction_type: str
    credits_delta: int
    balance_after: int
    tokens: Optional[int] = None
    description: Optional[str] = None
    source: Optional[str] = None
    extra_metadata: Optional[Dict[str, Any]] = None
    repository_id: Optional[int] = None
    code_file_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreateCheckoutSessionRequest(BaseModel):
    """Request payload to start a Stripe checkout session."""

    credit_pack_id: int = Field(..., gt=0)


class StripeCheckoutSessionResponse(BaseModel):
    """Checkout session details returned to the frontend."""

    session_id: str
    url: str
    expires_at: datetime
    amount_total: int
    currency: str = "usd"
    status: str


class BillingSummaryResponse(BaseModel):
    """Aggregated billing summary for dashboards."""

    wallet: UserCreditWalletResponse
    tokens_per_credit: int
    estimated_token_cost_per_credit: float
    has_user_provided_api_key: bool

