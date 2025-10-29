"""
API endpoints for AI-powered code analysis features.

Provides endpoints for:
- Code Review generation
- Quality Metrics calculation
- Architecture Diagram creation
- Mentor Insights generation
- Batch analysis operations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
import time

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.repository import Repository, CodeFile
from app.schemas.code_analysis import (
    CodeReviewResponse, QualityMetricsResponse, ArchitectureDiagramResponse,
    MentorInsightsResponse, BatchAnalysisRequest, BatchAnalysisResponse
)
from app.services.code_analysis_service import get_code_analysis_service

router = APIRouter(prefix="/code-analysis", tags=["code-analysis"])


@router.post("/repositories/{repo_id}/files/{file_id}/review", response_model=CodeReviewResponse)
async def generate_code_review(
    repo_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate comprehensive code review for a specific file.
    
    Analyzes security vulnerabilities, performance issues, and best practices.
    Results are cached for 1 hour to optimize performance.
    """
    # Verify repository belongs to user
    repo_result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id
        )
    )
    repo = repo_result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get file
    file_result = await db.execute(
        select(CodeFile).where(
            CodeFile.id == file_id,
            CodeFile.repository_id == repo_id
        )
    )
    file = file_result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not file.original_content:
        raise HTTPException(status_code=400, detail="File content not available")
    
    try:
        start_time = time.time()
        
        # Get analysis service
        analysis_service = get_code_analysis_service()
        
        # Check if already cached in database
        if file.code_review:
            processing_time = time.time() - start_time
            return CodeReviewResponse(
                code_review=file.code_review,
                processing_time=processing_time,
                cached=True
            )
        
        # Generate code review
        code_review = await analysis_service.generate_code_review(
            code=file.original_content,
            language=file.language,
            file_path=file.file_path
        )
        
        # Update database
        file.code_review = code_review.dict()
        await db.commit()
        await db.refresh(file)
        
        processing_time = time.time() - start_time
        
        return CodeReviewResponse(
            code_review=code_review,
            processing_time=processing_time,
            cached=False
        )
        
    except Exception as e:
        print(f"Error generating code review: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate code review: {str(e)}"
        )


@router.post("/repositories/{repo_id}/files/{file_id}/quality", response_model=QualityMetricsResponse)
async def calculate_quality_metrics(
    repo_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate 5-metric code quality scoring system.
    
    Evaluates maintainability, testability, readability, performance, and security.
    Results are cached for 1 hour to optimize performance.
    """
    # Verify repository belongs to user
    repo_result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id
        )
    )
    repo = repo_result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get file
    file_result = await db.execute(
        select(CodeFile).where(
            CodeFile.id == file_id,
            CodeFile.repository_id == repo_id
        )
    )
    file = file_result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not file.original_content:
        raise HTTPException(status_code=400, detail="File content not available")
    
    try:
        start_time = time.time()
        
        # Get analysis service
        analysis_service = get_code_analysis_service()
        
        # Check if already cached in database
        if file.quality_metrics:
            processing_time = time.time() - start_time
            return QualityMetricsResponse(
                quality_metrics=file.quality_metrics,
                processing_time=processing_time,
                cached=True
            )
        
        # Calculate quality metrics
        quality_metrics = await analysis_service.calculate_quality_metrics(
            code=file.original_content,
            language=file.language,
            file_path=file.file_path
        )
        
        # Update database
        file.quality_metrics = quality_metrics.dict()
        await db.commit()
        await db.refresh(file)
        
        processing_time = time.time() - start_time
        
        return QualityMetricsResponse(
            quality_metrics=quality_metrics,
            processing_time=processing_time,
            cached=False
        )
        
    except Exception as e:
        print(f"Error calculating quality metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate quality metrics: {str(e)}"
        )


@router.post("/repositories/{repo_id}/files/{file_id}/architecture", response_model=ArchitectureDiagramResponse)
async def generate_architecture_diagram(
    repo_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate interactive architecture diagram showing component relationships.
    
    Creates a graph structure with nodes and edges representing code components
    and their interactions. Results are cached for 1 hour.
    """
    # Verify repository belongs to user
    repo_result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id
        )
    )
    repo = repo_result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get file
    file_result = await db.execute(
        select(CodeFile).where(
            CodeFile.id == file_id,
            CodeFile.repository_id == repo_id
        )
    )
    file = file_result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not file.original_content:
        raise HTTPException(status_code=400, detail="File content not available")
    
    try:
        start_time = time.time()
        
        # Get analysis service
        analysis_service = get_code_analysis_service()
        
        # Check if already cached in database
        if file.architecture_data:
            processing_time = time.time() - start_time
            return ArchitectureDiagramResponse(
                architecture_diagram=file.architecture_data,
                processing_time=processing_time,
                cached=True
            )
        
        # Generate architecture diagram
        architecture_diagram = await analysis_service.generate_architecture_diagram(
            code=file.original_content,
            language=file.language,
            file_path=file.file_path
        )
        
        # Update database
        file.architecture_data = architecture_diagram.dict()
        await db.commit()
        await db.refresh(file)
        
        processing_time = time.time() - start_time
        
        return ArchitectureDiagramResponse(
            architecture_diagram=architecture_diagram,
            processing_time=processing_time,
            cached=False
        )
        
    except Exception as e:
        print(f"Error generating architecture diagram: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate architecture diagram: {str(e)}"
        )


@router.post("/repositories/{repo_id}/files/{file_id}/mentor", response_model=MentorInsightsResponse)
async def generate_mentor_insights(
    repo_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate personalized mentoring insights and learning path.
    
    Assesses skill level and provides customized learning recommendations.
    Results are cached for 1 hour.
    """
    # Verify repository belongs to user
    repo_result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id
        )
    )
    repo = repo_result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get file
    file_result = await db.execute(
        select(CodeFile).where(
            CodeFile.id == file_id,
            CodeFile.repository_id == repo_id
        )
    )
    file = file_result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not file.original_content:
        raise HTTPException(status_code=400, detail="File content not available")
    
    try:
        start_time = time.time()
        
        # Get analysis service
        analysis_service = get_code_analysis_service()
        
        # Check if already cached in database
        if file.mentor_insights:
            processing_time = time.time() - start_time
            return MentorInsightsResponse(
                mentor_insights=file.mentor_insights,
                processing_time=processing_time,
                cached=True
            )
        
        # Generate mentor insights
        mentor_insights = await analysis_service.generate_mentor_insights(
            code=file.original_content,
            language=file.language,
            file_path=file.file_path
        )
        
        # Update database
        file.mentor_insights = mentor_insights.dict()
        await db.commit()
        await db.refresh(file)
        
        processing_time = time.time() - start_time
        
        return MentorInsightsResponse(
            mentor_insights=mentor_insights,
            processing_time=processing_time,
            cached=False
        )
        
    except Exception as e:
        print(f"Error generating mentor insights: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate mentor insights: {str(e)}"
        )


@router.post("/repositories/{repo_id}/analyze-all", response_model=BatchAnalysisResponse)
async def batch_analyze_repository(
    repo_id: int,
    request: BatchAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Perform batch analysis on all files in a repository.
    
    Allows selective analysis types and force regeneration of cached results.
    Useful for comprehensive repository analysis.
    """
    # Verify repository belongs to user
    repo_result = await db.execute(
        select(Repository).where(
            Repository.id == repo_id,
            Repository.user_id == current_user.id
        )
    )
    repo = repo_result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get all files in repository
    files_result = await db.execute(
        select(CodeFile).where(CodeFile.repository_id == repo_id)
    )
    files = files_result.scalars().all()
    
    if not files:
        raise HTTPException(status_code=404, detail="No files found in repository")
    
    try:
        start_time = time.time()
        results = {}
        cached_counts = {analysis_type: 0 for analysis_type in request.analysis_types}
        
        # Get analysis service
        analysis_service = get_code_analysis_service()
        
        for file in files:
            if not file.original_content:
                continue
            
            file_results = {}
            
            for analysis_type in request.analysis_types:
                try:
                    if analysis_type == "review":
                        # Check cache unless force regenerate
                        if not request.force_regenerate and file.code_review:
                            cached_counts["review"] += 1
                            continue
                        
                        code_review = await analysis_service.generate_code_review(
                            code=file.original_content,
                            language=file.language,
                            file_path=file.file_path
                        )
                        file.code_review = code_review.dict()
                        file_results["review"] = code_review
                        
                    elif analysis_type == "quality":
                        if not request.force_regenerate and file.quality_metrics:
                            cached_counts["quality"] += 1
                            continue
                        
                        quality_metrics = await analysis_service.calculate_quality_metrics(
                            code=file.original_content,
                            language=file.language,
                            file_path=file.file_path
                        )
                        file.quality_metrics = quality_metrics.dict()
                        file_results["quality"] = quality_metrics
                        
                    elif analysis_type == "architecture":
                        if not request.force_regenerate and file.architecture_data:
                            cached_counts["architecture"] += 1
                            continue
                        
                        architecture_diagram = await analysis_service.generate_architecture_diagram(
                            code=file.original_content,
                            language=file.language,
                            file_path=file.file_path
                        )
                        file.architecture_data = architecture_diagram.dict()
                        file_results["architecture"] = architecture_diagram
                        
                    elif analysis_type == "mentor":
                        if not request.force_regenerate and file.mentor_insights:
                            cached_counts["mentor"] += 1
                            continue
                        
                        mentor_insights = await analysis_service.generate_mentor_insights(
                            code=file.original_content,
                            language=file.language,
                            file_path=file.file_path
                        )
                        file.mentor_insights = mentor_insights.dict()
                        file_results["mentor"] = mentor_insights
                        
                except Exception as e:
                    print(f"Error in batch analysis for file {file.file_path}, type {analysis_type}: {e}")
                    file_results[analysis_type] = {"error": str(e)}
            
            if file_results:
                results[file.file_path] = file_results
        
        # Commit all changes
        await db.commit()
        
        processing_time = time.time() - start_time
        
        return BatchAnalysisResponse(
            results=results,
            processing_time=processing_time,
            cached_counts=cached_counts
        )
        
    except Exception as e:
        print(f"Error in batch analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch analysis failed: {str(e)}"
        )
