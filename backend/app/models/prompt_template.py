from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class PromptTemplate(Base):
    """Model for custom AI prompt templates"""
    __tablename__ = "prompt_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    # Template content
    system_prompt = Column(Text, nullable=False)
    function_prompt = Column(Text, nullable=False)
    class_prompt = Column(Text, nullable=False)
    file_prompt = Column(Text, nullable=False)
    
    # Template metadata
    category = Column(String(50), nullable=False)  # e.g., "beginner", "technical", "api", "tutorial"
    language_preference = Column(String(20), nullable=True)  # e.g., "python", "javascript", or null for all
    
    # Template settings
    is_default = Column(Boolean, default=False)
    is_public = Column(Boolean, default=True)
    
    # User association (null for system templates)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="prompt_templates")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<PromptTemplate(id={self.id}, name='{self.name}', category='{self.category}')>"
