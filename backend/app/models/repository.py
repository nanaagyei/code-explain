from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Repository(Base):
    """
    Repository model representing a code repository to document.
    
    Attributes:
        id: Primary key
        user_id: Foreign key to User
        name: Repository name
        url: Optional Git repository URL
        language: Primary programming language
        total_files: Total number of files to process
        processed_files: Number of files processed so far
        status: Processing status (pending, processing, completed, failed)
        meta_info: JSON field for additional repository info
        created_at: Timestamp of creation
        updated_at: Timestamp of last update
    """
    __tablename__ = "repositories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    url = Column(String, nullable=True)
    language = Column(String, nullable=True)
    total_files = Column(Integer, default=0)
    processed_files = Column(Integer, default=0)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    meta_info = Column(JSON, nullable=True)  # Renamed from 'metadata' (reserved keyword)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="repositories")
    files = relationship("CodeFile", back_populates="repository", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Repository(id={self.id}, name='{self.name}', status='{self.status}')>"


class CodeFile(Base):
    """
    CodeFile model representing an individual code file within a repository.
    
    Attributes:
        id: Primary key
        repository_id: Foreign key to Repository
        file_path: Relative path of the file
        language: Programming language of the file
        content_hash: SHA256 hash of file content (for caching)
        original_content: Original file content
        documented_content: Content with added comments
        documentation: JSON structured documentation (functions, classes, summary)
        complexity_score: Cyclomatic complexity score
        status: Processing status (pending, processing, completed, failed)
        error_message: Error message if processing failed
        created_at: Timestamp of creation
        updated_at: Timestamp of last update
    """
    __tablename__ = "code_files"
    
    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    file_path = Column(String, nullable=False)
    language = Column(String, nullable=False)
    content_hash = Column(String, nullable=False, index=True)  # For caching
    original_content = Column(Text, nullable=True)
    documented_content = Column(Text, nullable=True)
    documentation = Column(JSON, nullable=True)  # Structured docs
    complexity_score = Column(Integer, nullable=True)
    code_review = Column(JSON, nullable=True)  # Security vulnerabilities, performance issues, best practices
    quality_metrics = Column(JSON, nullable=True)  # 5-metric scoring system
    architecture_data = Column(JSON, nullable=True)  # Component relationships, dependencies, data flow
    mentor_insights = Column(JSON, nullable=True)  # Skill level, learning suggestions, challenges
    status = Column(String, default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    repository = relationship("Repository", back_populates="files")
    
    def __repr__(self):
        return f"<CodeFile(id={self.id}, path='{self.file_path}', status='{self.status}')>"
