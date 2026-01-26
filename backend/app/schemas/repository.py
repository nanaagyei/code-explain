"""
Pydantic schemas for Repository and CodeFile API requests/responses.
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Any


class RepositoryBase(BaseModel):
    """Base repository schema"""
    name: str = Field(..., min_length=1, max_length=200)
    url: Optional[str] = None
    language: Optional[str] = None


class RepositoryCreate(RepositoryBase):
    """Schema for creating a repository"""
    pass


class RepositoryResponse(RepositoryBase):
    """Schema for repository response"""
    id: int
    user_id: int
    total_files: int
    processed_files: int
    status: str  # pending, processing, completed, failed
    total_tokens_used: int
    total_credits_charged: int
    billing_currency: str
    last_billed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class CodeFileResponse(BaseModel):
    """Schema for code file response"""
    id: int
    repository_id: int
    file_path: str
    language: str
    complexity_score: Optional[int] = None
    status: str
    tokens_used: int
    credits_charged: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class FileDocumentationResponse(BaseModel):
    """Schema for file documentation details"""
    file_path: str
    language: str
    summary: str
    functions: List[Dict[str, Any]]
    classes: List[Dict[str, Any]]
    imports: List[str]
    complexity: int
    stats: Dict[str, Any]
    documented_code: str


class ContributorQuickStart(BaseModel):
    """Quick start guidance for contributors."""
    setup: str
    active_areas: List[str]
    common_patterns: List[str]


class StartHereSummary(BaseModel):
    """Repository-level starter guide."""
    project_summary: str
    problem_solved: str
    structure_overview: str
    entry_points: List[str]
    contributor_quick_start: ContributorQuickStart


class TraceFileResponse(BaseModel):
    """Trace this file: upstream/downstream dependencies and role."""
    upstream: List[str] = Field(default_factory=list, description="File paths that import this file")
    downstream: List[str] = Field(default_factory=list, description="File paths this file imports")
    role: str = Field(default="", description="Short plain-English role of this file")


class RepositoryDetailResponse(BaseModel):
    """Schema for repository with files"""
    repository: RepositoryResponse
    files: List[CodeFileResponse]
    start_here: Optional[StartHereSummary] = None
