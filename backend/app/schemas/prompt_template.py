from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PromptTemplateBase(BaseModel):
    """Base schema for prompt templates"""
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1)
    system_prompt: str = Field(..., min_length=1)
    function_prompt: str = Field(..., min_length=1)
    class_prompt: str = Field(..., min_length=1)
    file_prompt: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1, max_length=50)
    language_preference: Optional[str] = Field(None, max_length=20)
    is_default: bool = False
    is_public: bool = True


class PromptTemplateCreate(PromptTemplateBase):
    """Schema for creating a new prompt template"""
    pass


class PromptTemplateUpdate(BaseModel):
    """Schema for updating a prompt template"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1)
    system_prompt: Optional[str] = Field(None, min_length=1)
    function_prompt: Optional[str] = Field(None, min_length=1)
    class_prompt: Optional[str] = Field(None, min_length=1)
    file_prompt: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    language_preference: Optional[str] = Field(None, max_length=20)
    is_default: Optional[bool] = None
    is_public: Optional[bool] = None


class PromptTemplateResponse(PromptTemplateBase):
    """Schema for prompt template responses"""
    id: int
    user_id: Optional[int]
    usage_count: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class PromptTemplateListResponse(BaseModel):
    """Schema for listing prompt templates"""
    id: int
    name: str
    description: str
    category: str
    language_preference: Optional[str]
    is_default: bool
    is_public: bool
    usage_count: int

    class Config:
        from_attributes = True
