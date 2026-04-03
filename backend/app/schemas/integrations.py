from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, HttpUrl


class QualityWeightsUpdate(BaseModel):
    readability: float = Field(ge=0, le=1)
    maintainability: float = Field(ge=0, le=1)
    security: float = Field(ge=0, le=1)
    performance: float = Field(ge=0, le=1)
    testability: float = Field(ge=0, le=1)


class QualityWeightsResponse(BaseModel):
    weights: dict[str, float]


class QualitySnapshotResponse(BaseModel):
    id: int
    repository_id: int
    code_file_id: int
    source: str
    health_score: dict[str, Any]
    created_at: datetime


class QualityAggregateResponse(BaseModel):
    repository_id: int
    total_snapshots: int
    average_score: float
    latest_score: float | None
    latest_grade: str | None
    metrics_average: dict[str, float]


class GitHubPRAnalysisResponse(BaseModel):
    owner: str
    repo: str
    pr_number: int
    installation_id: int | None = None
    head_sha: str | None
    action: str
    status: str
    summary: str | None
    result_payload: dict[str, Any] | None
    updated_at: datetime | None


class GitHubPRCommentRequest(BaseModel):
    dry_run: bool = True
    body: str | None = None


class WebhookEndpointCreate(BaseModel):
    url: HttpUrl
    events: list[str]
    secret: str = Field(min_length=8, max_length=128)
    is_active: bool = True


class WebhookEndpointUpdate(BaseModel):
    events: list[str] | None = None
    secret: str | None = Field(default=None, min_length=8, max_length=128)
    is_active: bool | None = None


class WebhookEndpointResponse(BaseModel):
    id: int
    url: str
    events: list[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime | None


class WebhookDeliveryResponse(BaseModel):
    id: int
    endpoint_id: int
    event_name: str
    attempt_count: int
    status: str
    last_status_code: int | None
    last_error: str | None
    created_at: datetime
    delivered_at: datetime | None


class CollabSessionCreate(BaseModel):
    repository_id: int
    title: str = Field(min_length=1, max_length=255)
    saved_exploration_id: int | None = None


class CollabSessionResponse(BaseModel):
    id: int
    repository_id: int
    saved_exploration_id: int | None
    title: str
    is_active: bool
    created_at: datetime
    updated_at: datetime | None
    notes: list[dict[str, Any]]


class CollabNoteCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class AnalyticsOverviewResponse(BaseModel):
    repositories_total: int
    completed_repositories: int
    files_total: int
    average_health_score: float
    total_tokens_used: int
    total_credits_charged: int


class AnalyticsTrendPoint(BaseModel):
    date: str
    average_score: float
    snapshots: int


class AnalyticsTrendsResponse(BaseModel):
    days: int
    points: list[AnalyticsTrendPoint]


class RepositoryBenchmarkItem(BaseModel):
    repository_id: int
    repository_name: str
    average_score: float
    latest_score: float | None
    snapshots: int


class RepositoryBenchmarksResponse(BaseModel):
    items: list[RepositoryBenchmarkItem]
