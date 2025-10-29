"""
API endpoints for batch job management.
"""
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.batch_job import BatchJobStatus
from app.schemas.batch_job import (
    BatchJobCreate,
    BatchJobUpdate,
    BatchJobResponse,
    BatchJobSummary,
    BatchJobStats
)
from app.services.batch_job_service import BatchJobService


router = APIRouter(prefix="/batch-jobs", tags=["batch jobs"])


async def process_batch_job_background(batch_job_id: int, user_id: int):
    """
    Background task to process all items in a batch job.
    This will be called asynchronously after the batch job is created.
    """
    from app.core.database import AsyncSessionLocal
    from app.services.batch_job_service import BatchJobService
    from app.models.batch_job import BatchJobItemStatus
    from app.api.repositories import process_repository_background
    from app.services.github_service import GitHubService
    from app.models.repository import Repository
    import tempfile
    import os
    
    async with AsyncSessionLocal() as db:
        service = BatchJobService(db)
        
        # Mark batch job as started
        await service.start_batch_job(batch_job_id, user_id)
        
        # Get batch job with items
        batch_job = await service.get_batch_job(batch_job_id, user_id, include_items=True)
        if not batch_job:
            return
        
        # Process each item
        for item in batch_job.items:
            try:
                # Mark item as processing
                await service.update_item_status(item.id, BatchJobItemStatus.PROCESSING)
                
                # Create repository based on source type
                if item.source_type == 'github':
                    # GitHub URL processing
                    github_url = item.source_data.get('url')
                    max_files = item.source_data.get('max_files', 100)
                    prompt_template_id = item.source_data.get('prompt_template_id')
                    
                    github_service = GitHubService()
                    
                    with tempfile.TemporaryDirectory() as temp_dir:
                        # Clone repository
                        clone_path = await github_service.clone_repository(github_url, temp_dir)
                        
                        # Extract code files
                        files_data = github_service.extract_code_files(clone_path, max_files)
                        
                        if not files_data:
                            raise ValueError("No code files found in repository")
                        
                        # Create repository record
                        repo = Repository(
                            user_id=user_id,
                            name=item.name,
                            description=f"GitHub: {github_url}",
                            status='processing'
                        )
                        db.add(repo)
                        await db.commit()
                        await db.refresh(repo)
                        
                        # Save files and start processing
                        from app.api.repositories import save_uploaded_files
                        await save_uploaded_files(db, repo.id, files_data)
                        
                        # Start background processing
                        asyncio.create_task(process_repository_background(repo.id, prompt_template_id))
                        
                        # Mark item as completed
                        await service.update_item_status(
                            item.id,
                            BatchJobItemStatus.COMPLETED,
                            repository_id=repo.id
                        )
                
                elif item.source_type == 'file':
                    # File upload processing (would need to be implemented)
                    # For now, we'll skip this as files are already handled
                    await service.update_item_status(
                        item.id,
                        BatchJobItemStatus.SKIPPED,
                        error_message="File upload items not supported in batch mode yet"
                    )
                
                else:
                    await service.update_item_status(
                        item.id,
                        BatchJobItemStatus.FAILED,
                        error_message=f"Unsupported source type: {item.source_type}"
                    )
            
            except Exception as e:
                print(f"❌ Error processing batch item {item.id}: {e}")
                await service.update_item_status(
                    item.id,
                    BatchJobItemStatus.FAILED,
                    error_message=str(e)
                )


@router.post("/", response_model=BatchJobResponse, status_code=status.HTTP_201_CREATED)
async def create_batch_job(
    batch_job_in: BatchJobCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new batch job with multiple repositories to process.
    The batch job will be processed in the background.
    """
    service = BatchJobService(db)
    
    # Create batch job
    batch_job = await service.create_batch_job(batch_job_in, current_user.id)
    
    # Start background processing
    background_tasks.add_task(process_batch_job_background, batch_job.id, current_user.id)
    
    return batch_job


@router.get("/", response_model=List[BatchJobSummary])
async def list_batch_jobs(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[BatchJobStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all batch jobs for the current user."""
    service = BatchJobService(db)
    batch_jobs = await service.get_user_batch_jobs(
        current_user.id,
        skip=skip,
        limit=limit,
        status=status_filter
    )
    return batch_jobs


@router.get("/stats", response_model=BatchJobStats)
async def get_batch_job_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics for all batch jobs."""
    service = BatchJobService(db)
    stats = await service.get_batch_job_stats(current_user.id)
    return stats


@router.get("/{batch_job_id}", response_model=BatchJobResponse)
async def get_batch_job(
    batch_job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific batch job with all its items."""
    service = BatchJobService(db)
    batch_job = await service.get_batch_job(batch_job_id, current_user.id, include_items=True)
    
    if not batch_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch job not found"
        )
    
    return batch_job


@router.put("/{batch_job_id}", response_model=BatchJobResponse)
async def update_batch_job(
    batch_job_id: int,
    batch_job_in: BatchJobUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a batch job (name, description, etc.)."""
    service = BatchJobService(db)
    batch_job = await service.update_batch_job(batch_job_id, batch_job_in, current_user.id)
    
    if not batch_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch job not found"
        )
    
    return batch_job


@router.delete("/{batch_job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_batch_job(
    batch_job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a batch job and all its items."""
    service = BatchJobService(db)
    success = await service.delete_batch_job(batch_job_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch job not found"
        )


@router.post("/{batch_job_id}/cancel", response_model=BatchJobResponse)
async def cancel_batch_job(
    batch_job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a batch job (stops processing of remaining items)."""
    service = BatchJobService(db)
    batch_job = await service.cancel_batch_job(batch_job_id, current_user.id)
    
    if not batch_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch job not found"
        )
    
    return batch_job

