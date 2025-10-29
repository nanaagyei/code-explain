"""
Pydantic schemas for BatchJob and BatchJobItem models.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.batch_job import BatchJobStatus, BatchJobItemStatus


# ========== BatchJobItem Schemas ==========

class BatchJobItemBase(BaseModel):
    """Base schema for batch job items"""
    name: str
    source_type: str  # 'file', 'github', 'zip'
    source_data: Optional[Dict[str, Any]] = None


class BatchJobItemCreate(BatchJobItemBase):
    """Schema for creating a batch job item"""
    pass


class BatchJobItemResponse(BatchJobItemBase):
    """Schema for batch job item responses"""
    id: int
    batch_job_id: int
    repository_id: Optional[int] = None
    status: BatchJobItemStatus
    error_message: Optional[str] = None
    processing_time: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========== BatchJob Schemas ==========

class BatchJobBase(BaseModel):
    """Base schema for batch jobs"""
    name: str
    description: Optional[str] = None
    meta_info: Optional[Dict[str, Any]] = None


class BatchJobCreate(BatchJobBase):
    """Schema for creating a batch job"""
    items: List[BatchJobItemCreate] = Field(..., min_length=1)


class BatchJobUpdate(BaseModel):
    """Schema for updating a batch job"""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[BatchJobStatus] = None


class BatchJobResponse(BatchJobBase):
    """Schema for batch job responses"""
    id: int
    user_id: int
    status: BatchJobStatus
    total_items: int
    completed_items: int
    failed_items: int
    progress: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    items: Optional[List[BatchJobItemResponse]] = None

    class Config:
        from_attributes = True


class BatchJobSummary(BaseModel):
    """Summary schema for listing batch jobs (without items)"""
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    status: BatchJobStatus
    total_items: int
    completed_items: int
    failed_items: int
    progress: float
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BatchJobStats(BaseModel):
    """Statistics for batch jobs"""
    total_jobs: int
    pending_jobs: int
    processing_jobs: int
    completed_jobs: int
    failed_jobs: int
    cancelled_jobs: int
    total_repositories: int
    completed_repositories: int
    failed_repositories: int

