"""Add billing tables and cost tracking columns

Revision ID: cf3bd8cf73e2
Revises: b45226d19a77
Create Date: 2025-11-20 15:32:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cf3bd8cf73e2'
down_revision: Union[str, None] = 'b45226d19a77'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'credit_packs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('credits', sa.Integer(), nullable=False),
        sa.Column('price_cents', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='usd'),
        sa.Column('stripe_price_id', sa.String(length=255), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'user_credit_wallets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('balance_credits', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('lifetime_credits_purchased', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('lifetime_credits_spent', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_recalculated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_user_credit_wallet_user_id')
    )

    op.create_table(
        'stripe_checkout_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('credit_pack_id', sa.Integer(), nullable=True),
        sa.Column('stripe_session_id', sa.String(length=255), nullable=False),
        sa.Column('payment_intent_id', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='created'),
        sa.Column('amount_total', sa.Integer(), nullable=True),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='usd'),
        sa.Column('url', sa.String(length=500), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('raw_payload', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['credit_pack_id'], ['credit_packs.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('payment_intent_id'),
        sa.UniqueConstraint('stripe_session_id')
    )

    op.create_table(
        'credit_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('wallet_id', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.String(length=50), nullable=False),
        sa.Column('credits_delta', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('tokens', sa.Integer(), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('source', sa.String(length=100), nullable=True),
        sa.Column('extra_metadata', sa.JSON(), nullable=True),
        sa.Column('repository_id', sa.Integer(), nullable=True),
        sa.Column('code_file_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['code_file_id'], ['code_files.id'], ),
        sa.ForeignKeyConstraint(['repository_id'], ['repositories.id'], ),
        sa.ForeignKeyConstraint(['wallet_id'], ['user_credit_wallets.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.add_column('repositories', sa.Column('total_tokens_used', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('repositories', sa.Column('total_credits_charged', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('repositories', sa.Column('billing_currency', sa.String(length=10), nullable=False, server_default='usd'))
    op.add_column('repositories', sa.Column('last_billed_at', sa.DateTime(timezone=True), nullable=True))

    op.add_column('code_files', sa.Column('tokens_used', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('code_files', sa.Column('credits_charged', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('code_files', sa.Column('billing_metadata', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('code_files', 'billing_metadata')
    op.drop_column('code_files', 'credits_charged')
    op.drop_column('code_files', 'tokens_used')

    op.drop_column('repositories', 'last_billed_at')
    op.drop_column('repositories', 'billing_currency')
    op.drop_column('repositories', 'total_credits_charged')
    op.drop_column('repositories', 'total_tokens_used')

    op.drop_table('credit_transactions')
    op.drop_table('stripe_checkout_sessions')
    op.drop_table('user_credit_wallets')
    op.drop_table('credit_packs')

