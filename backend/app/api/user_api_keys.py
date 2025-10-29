from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.user_api_key import UserApiKey
from app.schemas.user_api_key import (
    UserApiKeyCreate,
    UserApiKeyUpdate,
    UserApiKeyResponse,
    UserApiKeyListResponse
)
from app.services.encryption_service import get_encryption_service

router = APIRouter(prefix="/user-api-keys", tags=["user-api-keys"])


@router.get("/", response_model=List[UserApiKeyListResponse])
async def get_user_api_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all API keys for the current user.
    """
    query = select(UserApiKey).where(UserApiKey.user_id == current_user.id)
    result = await db.execute(query)
    api_keys = result.scalars().all()
    
    return api_keys


@router.get("/{key_id}", response_model=UserApiKeyResponse)
async def get_user_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific API key by ID.
    """
    query = select(UserApiKey).where(
        and_(
            UserApiKey.id == key_id,
            UserApiKey.user_id == current_user.id
        )
    )
    
    result = await db.execute(query)
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    return api_key


@router.post("/", response_model=UserApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_user_api_key(
    key_data: UserApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new API key for the user.
    """
    encryption_service = get_encryption_service()
    
    # Check if user already has an API key with this name
    existing_query = select(UserApiKey).where(
        and_(
            UserApiKey.user_id == current_user.id,
            UserApiKey.name == key_data.name,
            UserApiKey.provider == key_data.provider
        )
    )
    existing = await db.execute(existing_query)
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an API key with this name for this provider"
        )
    
    # Encrypt the API key
    encrypted_key = encryption_service.encrypt(key_data.api_key)
    key_prefix = encryption_service.get_key_prefix(key_data.api_key)
    
    # Create new API key
    api_key = UserApiKey(
        user_id=current_user.id,
        name=key_data.name,
        provider=key_data.provider,
        encrypted_key=encrypted_key,
        key_prefix=key_prefix,
        is_active=key_data.is_active
    )
    
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    
    return api_key


@router.put("/{key_id}", response_model=UserApiKeyResponse)
async def update_user_api_key(
    key_id: int,
    key_data: UserApiKeyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an API key (name and active status only).
    """
    query = select(UserApiKey).where(
        and_(
            UserApiKey.id == key_id,
            UserApiKey.user_id == current_user.id
        )
    )
    
    result = await db.execute(query)
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    # Update fields
    update_data = key_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(api_key, field, value)
    
    await db.commit()
    await db.refresh(api_key)
    
    return api_key


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an API key.
    """
    query = select(UserApiKey).where(
        and_(
            UserApiKey.id == key_id,
            UserApiKey.user_id == current_user.id
        )
    )
    
    result = await db.execute(query)
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    await db.delete(api_key)
    await db.commit()


@router.post("/{key_id}/use", response_model=UserApiKeyResponse)
async def use_user_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark an API key as used (increment usage count and update last_used_at).
    """
    from sqlalchemy.sql import func
    
    query = select(UserApiKey).where(
        and_(
            UserApiKey.id == key_id,
            UserApiKey.user_id == current_user.id
        )
    )
    
    result = await db.execute(query)
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    api_key.usage_count += 1
    api_key.last_used_at = func.now()
    
    await db.commit()
    await db.refresh(api_key)
    
    return api_key


@router.get("/{key_id}/decrypt")
async def get_decrypted_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the decrypted API key (for use in AI services).
    This endpoint should be used carefully and only by the system.
    """
    query = select(UserApiKey).where(
        and_(
            UserApiKey.id == key_id,
            UserApiKey.user_id == current_user.id,
            UserApiKey.is_active == True
        )
    )
    
    result = await db.execute(query)
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found or inactive"
        )
    
    encryption_service = get_encryption_service()
    decrypted_key = encryption_service.decrypt(api_key.encrypted_key)
    
    # Update usage
    api_key.usage_count += 1
    api_key.last_used_at = func.now()
    await db.commit()
    
    return {
        "api_key": decrypted_key,
        "provider": api_key.provider,
        "name": api_key.name
    }
