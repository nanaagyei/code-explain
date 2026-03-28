"""Merge migration heads (tier1 columns + integrations)

Revision ID: a1b2c3d4e5f6
Revises: 45267c161a7e, 9a7f6c5b4d3e
Create Date: 2026-03-05

Merges the two migration branches:
- 45267c161a7e (tier1 AI features columns)
- 9a7f6c5b4d3e (integrations, webhooks, collaboration, quality profile tables)
"""

from typing import Sequence, Union

from alembic import op


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = ("45267c161a7e", "9a7f6c5b4d3e")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
