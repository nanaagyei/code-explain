from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    ForeignKey,
    Text,
    JSON,
    UniqueConstraint,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class CreditPack(Base):
    """
    Represents a prepaid credit bundle that can be purchased via Stripe.
    """

    __tablename__ = "credit_packs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    credits = Column(Integer, nullable=False)
    price_cents = Column(Integer, nullable=False)
    currency = Column(String(10), nullable=False, default="usd")
    stripe_price_id = Column(String(255), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    stripe_sessions = relationship("StripeCheckoutSession", back_populates="credit_pack")

    def __repr__(self):
        return (
            f"<CreditPack(id={self.id}, name='{self.name}', "
            f"credits={self.credits}, price_cents={self.price_cents})>"
        )


class UserCreditWallet(Base):
    """
    Stores the running balance of platform credits for a user.
    """

    __tablename__ = "user_credit_wallets"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_credit_wallet_user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    balance_credits = Column(Integer, nullable=False, default=0)
    lifetime_credits_purchased = Column(Integer, nullable=False, default=0)
    lifetime_credits_spent = Column(Integer, nullable=False, default=0)
    last_recalculated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="credit_wallet")
    transactions = relationship(
        "CreditTransaction",
        back_populates="wallet",
        cascade="all, delete-orphan",
        order_by="CreditTransaction.created_at.desc()",
    )

    def __repr__(self):
        return (
            f"<UserCreditWallet(user_id={self.user_id}, "
            f"balance_credits={self.balance_credits})>"
        )


class CreditTransaction(Base):
    """
    Immutable ledger entry describing credit debits/credits for a wallet.
    """

    __tablename__ = "credit_transactions"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("user_credit_wallets.id"), nullable=False)
    transaction_type = Column(String(50), nullable=False)  # deposit, debit, refund, bonus
    credits_delta = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    tokens = Column(Integer, nullable=True)
    description = Column(String(255), nullable=True)
    source = Column(String(100), nullable=True)
    extra_metadata = Column(JSON, nullable=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=True)
    code_file_id = Column(Integer, ForeignKey("code_files.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    wallet = relationship("UserCreditWallet", back_populates="transactions")

    def __repr__(self):
        return (
            f"<CreditTransaction(id={self.id}, wallet_id={self.wallet_id}, "
            f"type='{self.transaction_type}', credits_delta={self.credits_delta})>"
        )


class StripeCheckoutSession(Base):
    """
    Stores Stripe Checkout sessions so webhook handling is idempotent.
    """

    __tablename__ = "stripe_checkout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    credit_pack_id = Column(Integer, ForeignKey("credit_packs.id"), nullable=True)
    stripe_session_id = Column(String(255), nullable=False, unique=True)
    payment_intent_id = Column(String(255), nullable=True, unique=True)
    status = Column(
        String(50),
        nullable=False,
        default="created",
    )  # created, completed, expired, failed
    amount_total = Column(Integer, nullable=True)
    currency = Column(String(10), nullable=False, default="usd")
    url = Column(String(500), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    raw_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="stripe_sessions")
    credit_pack = relationship("CreditPack", back_populates="stripe_sessions")

    def __repr__(self):
        return (
            f"<StripeCheckoutSession(id={self.id}, user_id={self.user_id}, "
            f"stripe_session_id='{self.stripe_session_id}', status='{self.status}')>"
        )

