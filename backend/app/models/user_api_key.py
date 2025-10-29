from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class UserApiKey(Base):
    """Model for storing user's encrypted API keys"""
    __tablename__ = "user_api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # API key metadata
    name = Column(String(100), nullable=False)  # e.g., "My OpenAI Key", "Work Key"
    provider = Column(String(50), nullable=False)  # e.g., "openai", "anthropic", "azure"
    encrypted_key = Column(Text, nullable=False)  # Encrypted API key
    key_prefix = Column(String(20), nullable=False)  # First few chars for identification (e.g., "sk-...")
    
    # Usage tracking
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="api_keys")
    
    def __repr__(self):
        return f"<UserApiKey(id={self.id}, user_id={self.user_id}, provider='{self.provider}', name='{self.name}')>"
