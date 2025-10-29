"""
BatchJob and BatchJobItem models for managing bulk repository processing.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class BatchJobStatus(str, enum.Enum):
    """Status of a batch job"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class BatchJobItemStatus(str, enum.Enum):
    """Status of an individual item in a batch job"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class BatchJob(Base):
    """
    BatchJob model for managing bulk repository processing operations.
    
    Attributes:
        id: Primary key
        user_id: Foreign key to User model (owner)
        name: User-defined name for the batch job
        description: Optional description
        status: Current status of the batch job
        total_items: Total number of repositories/items in the batch
        completed_items: Number of completed items
        failed_items: Number of failed items
        progress: Progress percentage (0-100)
        meta_info: JSON metadata (settings, options, etc.)
        created_at: Timestamp of creation
        updated_at: Timestamp of last update
        started_at: Timestamp when processing started
        completed_at: Timestamp when processing completed
    """
    __tablename__ = "batch_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(Enum(BatchJobStatus), default=BatchJobStatus.PENDING, nullable=False)
    total_items = Column(Integer, default=0)
    completed_items = Column(Integer, default=0)
    failed_items = Column(Integer, default=0)
    progress = Column(Float, default=0.0)  # 0-100
    meta_info = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="batch_jobs")
    items = relationship("BatchJobItem", back_populates="batch_job", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<BatchJob(id={self.id}, name='{self.name}', status='{self.status}')>"
    
    def update_progress(self):
        """Calculate and update the progress percentage"""
        if self.total_items == 0:
            self.progress = 0.0
        else:
            self.progress = (self.completed_items / self.total_items) * 100


class BatchJobItem(Base):
    """
    BatchJobItem model for tracking individual repositories in a batch job.
    
    Attributes:
        id: Primary key
        batch_job_id: Foreign key to BatchJob
        repository_id: Foreign key to Repository (if created)
        name: Name of the repository/item
        source_type: Type of source ('file', 'github', 'zip')
        source_data: JSON data about the source (URL, file paths, etc.)
        status: Current status of this item
        error_message: Error message if failed
        processing_time: Time taken to process (in seconds)
        created_at: Timestamp of creation
        updated_at: Timestamp of last update
        started_at: Timestamp when processing started
        completed_at: Timestamp when processing completed
    """
    __tablename__ = "batch_job_items"
    
    id = Column(Integer, primary_key=True, index=True)
    batch_job_id = Column(Integer, ForeignKey("batch_jobs.id"), nullable=False)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=True)
    name = Column(String, nullable=False)
    source_type = Column(String, nullable=False)  # 'file', 'github', 'zip'
    source_data = Column(JSON, nullable=True)  # Store file paths, URLs, etc.
    status = Column(Enum(BatchJobItemStatus), default=BatchJobItemStatus.PENDING, nullable=False)
    error_message = Column(String, nullable=True)
    processing_time = Column(Float, nullable=True)  # in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    batch_job = relationship("BatchJob", back_populates="items")
    # Note: repository relationship removed to avoid backref conflict with User.repositories
    # Access repository via db.get(Repository, item.repository_id) if needed
    
    def __repr__(self):
        return f"<BatchJobItem(id={self.id}, name='{self.name}', status='{self.status}')>"

