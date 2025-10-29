"""
Service for managing batch job operations.
"""
import asyncio
from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.batch_job import BatchJob, BatchJobItem, BatchJobStatus, BatchJobItemStatus
from app.models.repository import Repository
from app.schemas.batch_job import BatchJobCreate, BatchJobUpdate, BatchJobStats


class BatchJobService:
    """Service for managing batch jobs and items"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_batch_job(
        self, 
        batch_job_in: BatchJobCreate, 
        user_id: int
    ) -> BatchJob:
        """
        Create a new batch job with items.
        """
        # Create the batch job
        batch_job = BatchJob(
            user_id=user_id,
            name=batch_job_in.name,
            description=batch_job_in.description,
            meta_info=batch_job_in.meta_info,
            total_items=len(batch_job_in.items),
            status=BatchJobStatus.PENDING
        )
        self.db.add(batch_job)
        await self.db.flush()  # Get the batch_job.id
        
        # Create batch job items
        for item_data in batch_job_in.items:
            item = BatchJobItem(
                batch_job_id=batch_job.id,
                name=item_data.name,
                source_type=item_data.source_type,
                source_data=item_data.source_data,
                status=BatchJobItemStatus.PENDING
            )
            self.db.add(item)
        
        await self.db.commit()
        await self.db.refresh(batch_job)
        
        return batch_job
    
    async def get_batch_job(
        self, 
        batch_job_id: int, 
        user_id: int,
        include_items: bool = True
    ) -> Optional[BatchJob]:
        """Get a batch job by ID with optional items."""
        query = select(BatchJob).where(
            BatchJob.id == batch_job_id,
            BatchJob.user_id == user_id
        )
        
        if include_items:
            query = query.options(selectinload(BatchJob.items))
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_user_batch_jobs(
        self, 
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[BatchJobStatus] = None
    ) -> List[BatchJob]:
        """Get all batch jobs for a user."""
        query = select(BatchJob).where(BatchJob.user_id == user_id)
        
        if status:
            query = query.where(BatchJob.status == status)
        
        query = query.order_by(BatchJob.created_at.desc()).offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def update_batch_job(
        self,
        batch_job_id: int,
        batch_job_in: BatchJobUpdate,
        user_id: int
    ) -> Optional[BatchJob]:
        """Update a batch job."""
        batch_job = await self.get_batch_job(batch_job_id, user_id, include_items=False)
        if not batch_job:
            return None
        
        update_data = batch_job_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(batch_job, key, value)
        
        await self.db.commit()
        await self.db.refresh(batch_job)
        
        return batch_job
    
    async def delete_batch_job(
        self,
        batch_job_id: int,
        user_id: int
    ) -> bool:
        """Delete a batch job and all its items."""
        batch_job = await self.get_batch_job(batch_job_id, user_id, include_items=False)
        if not batch_job:
            return False
        
        await self.db.delete(batch_job)
        await self.db.commit()
        
        return True
    
    async def start_batch_job(
        self,
        batch_job_id: int,
        user_id: int
    ) -> Optional[BatchJob]:
        """Mark a batch job as started."""
        batch_job = await self.get_batch_job(batch_job_id, user_id, include_items=False)
        if not batch_job:
            return None
        
        batch_job.status = BatchJobStatus.PROCESSING
        batch_job.started_at = datetime.now()
        
        await self.db.commit()
        await self.db.refresh(batch_job)
        
        return batch_job
    
    async def complete_batch_job(
        self,
        batch_job_id: int
    ) -> Optional[BatchJob]:
        """Mark a batch job as completed."""
        batch_job = await self.db.get(BatchJob, batch_job_id)
        if not batch_job:
            return None
        
        # Determine final status based on items
        if batch_job.failed_items == batch_job.total_items:
            batch_job.status = BatchJobStatus.FAILED
        elif batch_job.failed_items > 0:
            batch_job.status = BatchJobStatus.COMPLETED  # Partial success
        else:
            batch_job.status = BatchJobStatus.COMPLETED
        
        batch_job.completed_at = datetime.now()
        batch_job.progress = 100.0
        
        await self.db.commit()
        await self.db.refresh(batch_job)
        
        return batch_job
    
    async def cancel_batch_job(
        self,
        batch_job_id: int,
        user_id: int
    ) -> Optional[BatchJob]:
        """Cancel a batch job."""
        batch_job = await self.get_batch_job(batch_job_id, user_id, include_items=False)
        if not batch_job:
            return None
        
        if batch_job.status in [BatchJobStatus.COMPLETED, BatchJobStatus.FAILED]:
            return batch_job  # Already finished
        
        batch_job.status = BatchJobStatus.CANCELLED
        batch_job.completed_at = datetime.now()
        
        await self.db.commit()
        await self.db.refresh(batch_job)
        
        return batch_job
    
    # ========== Batch Job Item Methods ==========
    
    async def get_batch_job_item(
        self,
        item_id: int
    ) -> Optional[BatchJobItem]:
        """Get a batch job item by ID."""
        return await self.db.get(BatchJobItem, item_id)
    
    async def update_item_status(
        self,
        item_id: int,
        status: BatchJobItemStatus,
        error_message: Optional[str] = None,
        repository_id: Optional[int] = None
    ) -> Optional[BatchJobItem]:
        """Update a batch job item status."""
        item = await self.db.get(BatchJobItem, item_id)
        if not item:
            return None
        
        item.status = status
        
        if status == BatchJobItemStatus.PROCESSING:
            item.started_at = datetime.now()
        elif status in [BatchJobItemStatus.COMPLETED, BatchJobItemStatus.FAILED, BatchJobItemStatus.SKIPPED]:
            item.completed_at = datetime.now()
            if item.started_at:
                item.processing_time = (item.completed_at - item.started_at).total_seconds()
        
        if error_message:
            item.error_message = error_message
        
        if repository_id:
            item.repository_id = repository_id
        
        await self.db.commit()
        await self.db.refresh(item)
        
        # Update parent batch job progress
        await self._update_batch_job_progress(item.batch_job_id)
        
        return item
    
    async def _update_batch_job_progress(self, batch_job_id: int):
        """Update the progress of a batch job based on its items."""
        batch_job = await self.db.get(BatchJob, batch_job_id)
        if not batch_job:
            return
        
        # Count completed and failed items
        result = await self.db.execute(
            select(
                func.count(BatchJobItem.id).filter(
                    BatchJobItem.batch_job_id == batch_job_id,
                    BatchJobItem.status == BatchJobItemStatus.COMPLETED
                ).label('completed'),
                func.count(BatchJobItem.id).filter(
                    BatchJobItem.batch_job_id == batch_job_id,
                    BatchJobItem.status == BatchJobItemStatus.FAILED
                ).label('failed')
            )
        )
        counts = result.first()
        
        batch_job.completed_items = counts.completed if counts else 0
        batch_job.failed_items = counts.failed if counts else 0
        batch_job.update_progress()
        
        # If all items are done, mark batch job as completed
        if (batch_job.completed_items + batch_job.failed_items) >= batch_job.total_items:
            await self.complete_batch_job(batch_job_id)
        
        await self.db.commit()
    
    async def get_batch_job_stats(self, user_id: int) -> BatchJobStats:
        """Get statistics for all batch jobs for a user."""
        # Count jobs by status
        result = await self.db.execute(
            select(
                BatchJob.status,
                func.count(BatchJob.id).label('count')
            ).where(
                BatchJob.user_id == user_id
            ).group_by(BatchJob.status)
        )
        
        status_counts = {row.status: row.count for row in result}
        
        # Count total repositories
        repo_result = await self.db.execute(
            select(
                func.count(BatchJobItem.id).label('total'),
                func.count(BatchJobItem.id).filter(
                    BatchJobItem.status == BatchJobItemStatus.COMPLETED
                ).label('completed'),
                func.count(BatchJobItem.id).filter(
                    BatchJobItem.status == BatchJobItemStatus.FAILED
                ).label('failed')
            ).join(
                BatchJob, BatchJobItem.batch_job_id == BatchJob.id
            ).where(
                BatchJob.user_id == user_id
            )
        )
        
        repo_counts = repo_result.first()
        
        return BatchJobStats(
            total_jobs=sum(status_counts.values()),
            pending_jobs=status_counts.get(BatchJobStatus.PENDING, 0),
            processing_jobs=status_counts.get(BatchJobStatus.PROCESSING, 0),
            completed_jobs=status_counts.get(BatchJobStatus.COMPLETED, 0),
            failed_jobs=status_counts.get(BatchJobStatus.FAILED, 0),
            cancelled_jobs=status_counts.get(BatchJobStatus.CANCELLED, 0),
            total_repositories=repo_counts.total if repo_counts else 0,
            completed_repositories=repo_counts.completed if repo_counts else 0,
            failed_repositories=repo_counts.failed if repo_counts else 0
        )

