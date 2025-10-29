from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.prompt_template import PromptTemplate
from app.schemas.prompt_template import (
    PromptTemplateCreate,
    PromptTemplateUpdate,
    PromptTemplateResponse,
    PromptTemplateListResponse
)

router = APIRouter(prefix="/prompt-templates", tags=["prompt-templates"])


@router.get("/", response_model=List[PromptTemplateListResponse])
async def get_prompt_templates(
    category: Optional[str] = None,
    language: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get available prompt templates.
    
    Args:
        category: Filter by template category (beginner, technical, api, tutorial)
        language: Filter by language preference
        current_user: Authenticated user
        db: Database session
    """
    query = select(PromptTemplate).where(
        or_(
            PromptTemplate.is_public == True,
            PromptTemplate.user_id == current_user.id
        )
    )
    
    if category:
        query = query.where(PromptTemplate.category == category)
    
    if language:
        query = query.where(
            or_(
                PromptTemplate.language_preference == language,
                PromptTemplate.language_preference.is_(None)
            )
        )
    
    query = query.order_by(PromptTemplate.is_default.desc(), PromptTemplate.usage_count.desc())
    
    result = await db.execute(query)
    templates = result.scalars().all()
    
    return templates


@router.get("/{template_id}", response_model=PromptTemplateResponse)
async def get_prompt_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific prompt template by ID.
    """
    query = select(PromptTemplate).where(
        and_(
            PromptTemplate.id == template_id,
            or_(
                PromptTemplate.is_public == True,
                PromptTemplate.user_id == current_user.id
            )
        )
    )
    
    result = await db.execute(query)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt template not found"
        )
    
    return template


@router.post("/", response_model=PromptTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt_template(
    template_data: PromptTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new custom prompt template.
    """
    # Check if user already has a template with this name
    existing_query = select(PromptTemplate).where(
        and_(
            PromptTemplate.user_id == current_user.id,
            PromptTemplate.name == template_data.name
        )
    )
    existing = await db.execute(existing_query)
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a template with this name"
        )
    
    # Create new template
    template = PromptTemplate(
        user_id=current_user.id,
        **template_data.model_dump()
    )
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    
    return template


@router.put("/{template_id}", response_model=PromptTemplateResponse)
async def update_prompt_template(
    template_id: int,
    template_data: PromptTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a custom prompt template (only user's own templates).
    """
    query = select(PromptTemplate).where(
        and_(
            PromptTemplate.id == template_id,
            PromptTemplate.user_id == current_user.id
        )
    )
    
    result = await db.execute(query)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or you don't have permission to edit it"
        )
    
    # Update fields
    update_data = template_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    await db.commit()
    await db.refresh(template)
    
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a custom prompt template (only user's own templates).
    """
    query = select(PromptTemplate).where(
        and_(
            PromptTemplate.id == template_id,
            PromptTemplate.user_id == current_user.id
        )
    )
    
    result = await db.execute(query)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or you don't have permission to delete it"
        )
    
    await db.delete(template)
    await db.commit()


@router.post("/{template_id}/use", response_model=PromptTemplateResponse)
async def use_prompt_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a prompt template as used (increment usage count).
    """
    query = select(PromptTemplate).where(
        and_(
            PromptTemplate.id == template_id,
            or_(
                PromptTemplate.is_public == True,
                PromptTemplate.user_id == current_user.id
            )
        )
    )
    
    result = await db.execute(query)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    template.usage_count += 1
    await db.commit()
    await db.refresh(template)
    
    return template
