from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    """
    User model for authentication and authorization.
    
    Attributes:
        id: Primary key
        email: Unique user email
        username: Unique username
        hashed_password: Bcrypt hashed password
        is_active: Account active status
        is_superuser: Admin privileges flag
        created_at: Timestamp of account creation
        updated_at: Timestamp of last update
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    repositories = relationship("Repository", back_populates="user")
    prompt_templates = relationship("PromptTemplate", back_populates="user")
    api_keys = relationship("UserApiKey", back_populates="user")
    batch_jobs = relationship("BatchJob", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
