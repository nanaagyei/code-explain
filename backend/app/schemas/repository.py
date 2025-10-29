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


class RepositoryDetailResponse(BaseModel):
    """Schema for repository with files"""
    repository: RepositoryResponse
    files: List[CodeFileResponse]
