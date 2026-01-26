"""
API endpoints for AI-powered code analysis features.

Provides endpoints for:
- Code Review generation
- Quality Metrics calculation
- Architecture Diagram creation
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
    CodeReviewResponse, HealthScoreResponse, ArchitectureDiagramResponse,
    QuickFileAnalysisRequest, QuickFileAnalysisResponse
)
from app.services.code_parser import CodeParser
from app.services.ai_service import AIDocumentationService
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


@router.post("/repositories/{repo_id}/files/{file_id}/quality", response_model=HealthScoreResponse)
async def calculate_quality_metrics(
    repo_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate aggregate code health score.
    
    Evaluates maintainability, testability, readability, performance, and security,
    then returns a single health score with a detailed breakdown.
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
            return HealthScoreResponse(
                health_score=file.quality_metrics,
                processing_time=processing_time,
                cached=True
            )
        
        # Calculate quality metrics
        health_score = await analysis_service.calculate_quality_metrics(
            code=file.original_content,
            language=file.language,
            file_path=file.file_path
        )
        
        # Update database
        file.quality_metrics = health_score.dict()
        await db.commit()
        await db.refresh(file)
        
        processing_time = time.time() - start_time
        
        return HealthScoreResponse(
            health_score=health_score,
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


@router.post("/quick-file", response_model=QuickFileAnalysisResponse)
async def quick_file_analysis(
    request: QuickFileAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze a standalone file for quick insights.

    Returns a concise summary and health score without storing data.
    """
    try:
        parser = CodeParser(request.language)
        parsed_code = parser.parse(request.code)

        ai_service = AIDocumentationService()
        summary_result = await ai_service.generate_file_summary(
            parsed_code,
            request.code,
            request.language,
            request.file_path
        )

        analysis_service = get_code_analysis_service()
        tokens_before = analysis_service.total_tokens_used
        health_score = await analysis_service.calculate_quality_metrics(
            code=request.code,
            language=request.language,
            file_path=request.file_path
        )
        tokens_after = analysis_service.total_tokens_used
        tokens_used = summary_result.tokens_used + max(0, tokens_after - tokens_before)

        return QuickFileAnalysisResponse(
            summary=summary_result.content,
            health_score=health_score,
            tokens_used=tokens_used
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error running quick file analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze file: {str(e)}"
        )


