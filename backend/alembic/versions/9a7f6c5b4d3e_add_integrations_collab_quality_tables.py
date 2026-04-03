"""Add integrations, webhooks, collaboration, and quality profile tables

Revision ID: 9a7f6c5b4d3e
Revises: cf3bd8cf73e2
Create Date: 2026-03-04 10:35:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9a7f6c5b4d3e"
down_revision: Union[str, None] = "cf3bd8cf73e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "quality_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("weights", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_quality_profiles_id", "quality_profiles", ["id"], unique=False)

    op.create_table(
        "quality_metric_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("repository_id", sa.Integer(), nullable=False),
        sa.Column("code_file_id", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=50), nullable=False),
        sa.Column("health_score", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["code_file_id"], ["code_files.id"]),
        sa.ForeignKeyConstraint(["repository_id"], ["repositories.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_quality_metric_snapshots_id", "quality_metric_snapshots", ["id"], unique=False)
    op.create_index("ix_quality_metric_snapshots_user_id", "quality_metric_snapshots", ["user_id"], unique=False)
    op.create_index(
        "ix_quality_metric_snapshots_repository_id",
        "quality_metric_snapshots",
        ["repository_id"],
        unique=False,
    )
    op.create_index("ix_quality_metric_snapshots_code_file_id", "quality_metric_snapshots", ["code_file_id"], unique=False)
    op.create_index("ix_quality_metric_snapshots_created_at", "quality_metric_snapshots", ["created_at"], unique=False)

    op.create_table(
        "github_pr_analyses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner", sa.String(length=255), nullable=False),
        sa.Column("repo", sa.String(length=255), nullable=False),
        sa.Column("pr_number", sa.Integer(), nullable=False),
        sa.Column("installation_id", sa.Integer(), nullable=True),
        sa.Column("head_sha", sa.String(length=128), nullable=True),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("result_payload", sa.JSON(), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("owner", "repo", "pr_number", name="uq_github_pr_analysis"),
    )
    op.create_index("ix_github_pr_analyses_id", "github_pr_analyses", ["id"], unique=False)
    op.create_index("ix_github_pr_analyses_owner", "github_pr_analyses", ["owner"], unique=False)
    op.create_index("ix_github_pr_analyses_repo", "github_pr_analyses", ["repo"], unique=False)
    op.create_index("ix_github_pr_analyses_pr_number", "github_pr_analyses", ["pr_number"], unique=False)
    op.create_index(
        "ix_github_pr_analyses_installation_id",
        "github_pr_analyses",
        ["installation_id"],
        unique=False,
    )

    op.create_table(
        "outbound_webhook_endpoints",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("events", sa.JSON(), nullable=False),
        sa.Column("secret", sa.String(length=256), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_outbound_webhook_endpoints_id", "outbound_webhook_endpoints", ["id"], unique=False)
    op.create_index(
        "ix_outbound_webhook_endpoints_user_id",
        "outbound_webhook_endpoints",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "outbound_webhook_deliveries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("endpoint_id", sa.Integer(), nullable=False),
        sa.Column("event_name", sa.String(length=80), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("last_status_code", sa.Integer(), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["endpoint_id"], ["outbound_webhook_endpoints.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_outbound_webhook_deliveries_id", "outbound_webhook_deliveries", ["id"], unique=False)
    op.create_index(
        "ix_outbound_webhook_deliveries_endpoint_id",
        "outbound_webhook_deliveries",
        ["endpoint_id"],
        unique=False,
    )
    op.create_index(
        "ix_outbound_webhook_deliveries_event_name",
        "outbound_webhook_deliveries",
        ["event_name"],
        unique=False,
    )

    op.create_table(
        "saved_explorations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("share_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("repository_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("state", sa.JSON(), nullable=True),
        sa.Column("is_public", sa.Integer(), nullable=True, server_default="1"),
        sa.Column("view_count", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["repository_id"], ["repositories.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_saved_explorations_id", "saved_explorations", ["id"], unique=False)
    op.create_index("ix_saved_explorations_share_id", "saved_explorations", ["share_id"], unique=True)

    op.create_table(
        "collaboration_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("repository_id", sa.Integer(), nullable=False),
        sa.Column("saved_exploration_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["repository_id"], ["repositories.id"]),
        sa.ForeignKeyConstraint(["saved_exploration_id"], ["saved_explorations.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_collaboration_sessions_id", "collaboration_sessions", ["id"], unique=False)
    op.create_index("ix_collaboration_sessions_user_id", "collaboration_sessions", ["user_id"], unique=False)
    op.create_index(
        "ix_collaboration_sessions_repository_id",
        "collaboration_sessions",
        ["repository_id"],
        unique=False,
    )

    op.create_table(
        "collaboration_notes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["collaboration_sessions.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_collaboration_notes_id", "collaboration_notes", ["id"], unique=False)
    op.create_index("ix_collaboration_notes_session_id", "collaboration_notes", ["session_id"], unique=False)
    op.create_index("ix_collaboration_notes_user_id", "collaboration_notes", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_collaboration_notes_user_id", table_name="collaboration_notes")
    op.drop_index("ix_collaboration_notes_session_id", table_name="collaboration_notes")
    op.drop_index("ix_collaboration_notes_id", table_name="collaboration_notes")
    op.drop_table("collaboration_notes")

    op.drop_index("ix_collaboration_sessions_repository_id", table_name="collaboration_sessions")
    op.drop_index("ix_collaboration_sessions_user_id", table_name="collaboration_sessions")
    op.drop_index("ix_collaboration_sessions_id", table_name="collaboration_sessions")
    op.drop_table("collaboration_sessions")

    op.drop_index("ix_saved_explorations_share_id", table_name="saved_explorations")
    op.drop_index("ix_saved_explorations_id", table_name="saved_explorations")
    op.drop_table("saved_explorations")

    op.drop_index("ix_outbound_webhook_deliveries_event_name", table_name="outbound_webhook_deliveries")
    op.drop_index("ix_outbound_webhook_deliveries_endpoint_id", table_name="outbound_webhook_deliveries")
    op.drop_index("ix_outbound_webhook_deliveries_id", table_name="outbound_webhook_deliveries")
    op.drop_table("outbound_webhook_deliveries")

    op.drop_index("ix_outbound_webhook_endpoints_user_id", table_name="outbound_webhook_endpoints")
    op.drop_index("ix_outbound_webhook_endpoints_id", table_name="outbound_webhook_endpoints")
    op.drop_table("outbound_webhook_endpoints")

    op.drop_index("ix_github_pr_analyses_pr_number", table_name="github_pr_analyses")
    op.drop_index("ix_github_pr_analyses_installation_id", table_name="github_pr_analyses")
    op.drop_index("ix_github_pr_analyses_repo", table_name="github_pr_analyses")
    op.drop_index("ix_github_pr_analyses_owner", table_name="github_pr_analyses")
    op.drop_index("ix_github_pr_analyses_id", table_name="github_pr_analyses")
    op.drop_table("github_pr_analyses")

    op.drop_index("ix_quality_metric_snapshots_created_at", table_name="quality_metric_snapshots")
    op.drop_index("ix_quality_metric_snapshots_code_file_id", table_name="quality_metric_snapshots")
    op.drop_index("ix_quality_metric_snapshots_repository_id", table_name="quality_metric_snapshots")
    op.drop_index("ix_quality_metric_snapshots_user_id", table_name="quality_metric_snapshots")
    op.drop_index("ix_quality_metric_snapshots_id", table_name="quality_metric_snapshots")
    op.drop_table("quality_metric_snapshots")

    op.drop_index("ix_quality_profiles_id", table_name="quality_profiles")
    op.drop_table("quality_profiles")
