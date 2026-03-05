from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class QualityProfile(Base):
    __tablename__ = "quality_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    weights = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")


class QualityMetricSnapshot(Base):
    __tablename__ = "quality_metric_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=False, index=True)
    code_file_id = Column(Integer, ForeignKey("code_files.id"), nullable=False, index=True)
    source = Column(String(50), nullable=False, default="file_quality_endpoint")
    health_score = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User")
    repository = relationship("Repository")
    code_file = relationship("CodeFile")


class GitHubPRAnalysis(Base):
    __tablename__ = "github_pr_analyses"
    __table_args__ = (
        UniqueConstraint("owner", "repo", "pr_number", name="uq_github_pr_analysis"),
    )

    id = Column(Integer, primary_key=True, index=True)
    owner = Column(String(255), nullable=False, index=True)
    repo = Column(String(255), nullable=False, index=True)
    pr_number = Column(Integer, nullable=False, index=True)
    installation_id = Column(Integer, nullable=True, index=True)
    head_sha = Column(String(128), nullable=True)
    action = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    summary = Column(Text, nullable=True)
    result_payload = Column(JSON, nullable=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class OutboundWebhookEndpoint(Base):
    __tablename__ = "outbound_webhook_endpoints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    url = Column(String(2048), nullable=False)
    events = Column(JSON, nullable=False)
    secret = Column(String(256), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")


class OutboundWebhookDelivery(Base):
    __tablename__ = "outbound_webhook_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    endpoint_id = Column(
        Integer, ForeignKey("outbound_webhook_endpoints.id"), nullable=False, index=True
    )
    event_name = Column(String(80), nullable=False, index=True)
    payload = Column(JSON, nullable=False)
    attempt_count = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="queued")
    last_status_code = Column(Integer, nullable=True)
    last_error = Column(Text, nullable=True)
    next_attempt_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    endpoint = relationship("OutboundWebhookEndpoint")


class CollaborationSession(Base):
    __tablename__ = "collaboration_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=False, index=True)
    saved_exploration_id = Column(Integer, ForeignKey("saved_explorations.id"), nullable=True)
    title = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    repository = relationship("Repository")
    exploration = relationship("SavedExploration")


class CollaborationNote(Base):
    __tablename__ = "collaboration_notes"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer, ForeignKey("collaboration_sessions.id"), nullable=False, index=True
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("CollaborationSession")
    user = relationship("User")
