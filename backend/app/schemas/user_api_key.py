from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserApiKeyBase(BaseModel):
    """Base schema for user API keys"""
    name: str = Field(..., min_length=1, max_length=100)
    provider: str = Field(..., min_length=1, max_length=50)
    api_key: str = Field(..., min_length=1)  # Raw API key (will be encrypted)
    is_active: bool = True


class UserApiKeyCreate(UserApiKeyBase):
    """Schema for creating a new API key"""
    pass


class UserApiKeyUpdate(BaseModel):
    """Schema for updating an API key"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None


class UserApiKeyResponse(BaseModel):
    """Schema for API key responses (without the actual key)"""
    id: int
    user_id: int
    name: str
    provider: str
    key_prefix: str
    is_active: bool
    usage_count: int
    last_used_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserApiKeyListResponse(BaseModel):
    """Schema for listing API keys"""
    id: int
    name: str
    provider: str
    key_prefix: str
    is_active: bool
    usage_count: int
    last_used_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
