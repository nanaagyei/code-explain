# CodeExplain: Production-Ready Implementation Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack Deep Dive](#technology-stack-deep-dive)
4. [Development Environment Setup](#development-environment-setup)
5. [Phase 1: Core Backend (Week 1)](#phase-1-core-backend)
6. [Phase 2: Code Analysis Engine (Week 2)](#phase-2-code-analysis-engine)
7. [Phase 3: AI Integration & Optimization (Week 2-3)](#phase-3-ai-integration)
8. [Phase 4: Frontend & Polish (Week 3)](#phase-4-frontend)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Guide](#deployment-guide)
11. [Monitoring & Observability](#monitoring)
12. [Learning Resources](#learning-resources)

---

## Project Overview

### What You're Building
An intelligent system that automatically generates comprehensive documentation for code repositories using AI. It analyzes code structure, understands context, and produces human-readable explanations.

### Key Features
- Multi-language support (Python, JavaScript, TypeScript, Java, C++, Go)
- Repository-level context understanding
- Automatic inline comment generation
- Architecture diagram generation
- API documentation
- Code complexity analysis
- Intelligent caching to reduce API costs

### Success Metrics
- Process 100+ repositories
- Generate documentation in <60 seconds per file
- 90%+ accuracy in technical explanations
- Support 50+ concurrent users
- Cost <$0.10 per file analyzed

---

## System Architecture

### High-Level Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────┐
│         Load Balancer (Azure)        │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌─────────┐   ┌─────────┐
│ API     │   │ API     │
│ Server  │   │ Server  │
│ (FastAPI│   │ (FastAPI│
└────┬────┘   └────┬────┘
     │             │
     └──────┬──────┘
            ▼
    ┌──────────────┐
    │    Redis     │
    │   (Cache)    │
    └──────────────┘
            │
            ▼
    ┌──────────────┐      ┌─────────────┐
    │  PostgreSQL  │◄────►│  Azure AI   │
    │  (Metadata)  │      │  (OpenAI)   │
    └──────────────┘      └─────────────┘
            │
            ▼
    ┌──────────────┐
    │ Azure Blob   │
    │  Storage     │
    │ (Docs/Code)  │
    └──────────────┘
```

### Component Breakdown

**1. API Server (FastAPI)**
- Handles HTTP requests
- Coordinates code analysis pipeline
- Manages authentication & rate limiting
- Streams real-time progress updates

**2. Code Analysis Engine**
- Parses code into Abstract Syntax Trees (AST)
- Extracts functions, classes, imports
- Calculates complexity metrics
- Builds dependency graphs

**3. AI Service Layer**
- Interfaces with Azure OpenAI
- Manages prompt templates
- Implements retry logic & error handling
- Optimizes token usage

**4. Caching Layer (Redis)**
- Caches AI responses (hash-based)
- Stores temporary processing state
- Rate limit counters
- Session management

**5. Database (PostgreSQL)**
- User accounts & authentication
- Repository metadata
- Documentation versions
- Usage analytics

**6. Storage (Azure Blob)**
- Source code files
- Generated documentation
- Architecture diagrams

---

## Technology Stack Deep Dive

### Backend: FastAPI (Python)

**Why FastAPI?**
- Built-in async support (critical for AI API calls)
- Automatic API documentation (Swagger)
- Type hints for better code quality
- Fast performance (comparable to Node.js)
- Great for ML/AI integration

**Learning Path:**
- Async/await in Python
- Pydantic models for validation
- Dependency injection
- Background tasks

### Code Parsing: Tree-sitter

**Why Tree-sitter?**
- Multi-language support
- Incremental parsing (fast)
- Accurate AST generation
- Used by GitHub, Atom

**What You'll Learn:**
- Abstract Syntax Trees (AST)
- Syntax vs semantics
- Query languages for code

### AI: Azure OpenAI Service

**Why Azure OpenAI?**
- Enterprise-grade reliability
- Data privacy guarantees
- Integration with Azure ecosystem
- Fits Microsoft application context

**Models to Use:**
- GPT-4o for complex explanations
- GPT-4o-mini for simple docs
- Embeddings for semantic search

**What You'll Learn:**
- Prompt engineering
- Token management
- Rate limiting strategies
- Cost optimization

### Database: PostgreSQL

**Why PostgreSQL?**
- Robust & battle-tested
- JSON support for flexible schemas
- Full-text search capabilities
- Excellent Azure support

### Cache: Redis

**Why Redis?**
- In-memory performance
- Built-in data structures
- Pub/sub for real-time updates
- Easy to deploy

### Frontend: React + TypeScript

**Why This Stack?**
- TypeScript prevents bugs
- React is industry standard
- Large ecosystem
- Great for dashboards

---

## Development Environment Setup

### Prerequisites

```bash
# Required software
- Python 3.11+
- Node.js 18+
- Docker Desktop
- Git
- VS Code (recommended)

# VS Code Extensions
- Python
- Pylance
- REST Client
- Docker
- Azure Account (optional for deployment)
```

### Local Development Setup

**Step 1: Create Project Structure**

```bash
mkdir codeexplain
cd codeexplain

# Backend
mkdir -p backend/{app,tests}
mkdir -p backend/app/{api,core,models,services,utils}

# Frontend
mkdir frontend

# Infrastructure
mkdir -p infra/{docker,k8s}

# Documentation
mkdir docs
```

**Step 2: Backend Virtual Environment**

```bash
cd backend
python -m venv venv

# Activate (Mac/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn python-multipart
pip install openai azure-identity azure-storage-blob
pip install tree-sitter tree-sitter-python tree-sitter-javascript
pip install sqlalchemy asyncpg alembic
pip install redis python-jose passlib bcrypt
pip install pytest pytest-asyncio httpx
pip install python-dotenv pydantic-settings
```

**Step 3: Docker Setup (Local Services)**

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: codeexplain
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: codeexplain_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@codeexplain.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"

volumes:
  postgres_data:
  redis_data:
```

Start services:
```bash
docker-compose up -d
```

**Step 4: Environment Variables**

Create `backend/.env`:

```env
# Application
APP_NAME=CodeExplain
ENV=development
DEBUG=True
SECRET_KEY=your-secret-key-change-in-production

# Database
DATABASE_URL=postgresql+asyncpg://codeexplain:dev_password@localhost:5432/codeexplain_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_GPT4=gpt-4o
AZURE_OPENAI_DEPLOYMENT_GPT4_MINI=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Azure Storage (optional for now)
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_STORAGE_CONTAINER=codeexplain-files

# Security
CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Rate Limiting
RATE_LIMIT_PER_MINUTE=20
MAX_FILE_SIZE_MB=10
```

---

## Phase 1: Core Backend (Week 1)

### Day 1-2: Project Foundation

**Goal:** Set up FastAPI application with proper structure

**File: `backend/app/core/config.py`**

```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "CodeExplain"
    env: str = "development"
    debug: bool = True
    secret_key: str
    
    # Database
    database_url: str
    
    # Redis
    redis_url: str
    
    # Azure OpenAI
    azure_openai_endpoint: str
    azure_openai_key: str
    azure_openai_deployment_gpt4: str
    azure_openai_deployment_gpt4_mini: str
    azure_openai_api_version: str
    
    # Security
    cors_origins: list[str] = ["http://localhost:3000"]
    access_token_expire_minutes: int = 30
    
    # Rate Limiting
    rate_limit_per_minute: int = 20
    max_file_size_mb: int = 10
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

**Learning: Why @lru_cache?**
- Settings are expensive to load (reads .env file)
- Cache ensures we only load once
- Returns same instance for all requests

**File: `backend/app/core/database.py`**

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import get_settings

settings = get_settings()

# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    future=True,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=10,
    max_overflow=20
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()


# Dependency for getting DB session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

**Learning: Async SQLAlchemy**
- `create_async_engine`: Non-blocking DB operations
- `async_sessionmaker`: Factory for async sessions
- `pool_pre_ping`: Checks if connection alive before use
- Prevents "connection lost" errors

**File: `backend/app/core/cache.py`**

```python
import redis.asyncio as redis
from app.core.config import get_settings
import json
import hashlib

settings = get_settings()


class RedisCache:
    def __init__(self):
        self.redis: redis.Redis | None = None
    
    async def connect(self):
        self.redis = await redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True
        )
    
    async def disconnect(self):
        if self.redis:
            await self.redis.close()
    
    async def get(self, key: str):
        if not self.redis:
            return None
        value = await self.redis.get(key)
        if value:
            return json.loads(value)
        return None
    
    async def set(self, key: str, value: dict, expire: int = 3600):
        if not self.redis:
            return
        await self.redis.set(
            key,
            json.dumps(value),
            ex=expire
        )
    
    async def delete(self, key: str):
        if not self.redis:
            return
        await self.redis.delete(key)
    
    def generate_cache_key(self, prefix: str, *args) -> str:
        """Generate consistent cache key from args"""
        content = f"{prefix}:" + ":".join(str(arg) for arg in args)
        return hashlib.md5(content.encode()).hexdigest()


# Global cache instance
cache = RedisCache()
```

**Learning: Cache Key Generation**
- Hash prevents super long keys
- Prefix helps organize keys
- Consistent hashing = same input = same key

**File: `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import get_settings
from app.core.cache import cache
from app.core.database import engine, Base

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    await cache.connect()
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Shutdown
    print("Shutting down...")
    await cache.disconnect()
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "CodeExplain API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

**Learning: Lifespan Events**
- Replaces deprecated `@app.on_event("startup")`
- Ensures cleanup even if app crashes
- Good for resource management

**Run the app:**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` to see auto-generated API docs!

### Day 3-4: Database Models & Authentication

**File: `backend/app/models/user.py`**

```python
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

**File: `backend/app/models/repository.py`**

```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    url = Column(String, nullable=True)
    language = Column(String, nullable=True)
    total_files = Column(Integer, default=0)
    processed_files = Column(Integer, default=0)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", backref="repositories")
    files = relationship("CodeFile", back_populates="repository", cascade="all, delete-orphan")


class CodeFile(Base):
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
    status = Column(String, default="pending")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    repository = relationship("Repository", back_populates="files")
```

**Create migration:**
```bash
# Install alembic
pip install alembic

# Initialize
alembic init alembic

# Edit alembic.ini - set sqlalchemy.url to your DATABASE_URL
# Edit alembic/env.py - import your models
```

**File: `backend/alembic/env.py` (modify):**

```python
from app.core.config import get_settings
from app.core.database import Base
from app.models.user import User
from app.models.repository import Repository, CodeFile

settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url)
target_metadata = Base.metadata
```

**Create first migration:**
```bash
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

**File: `backend/app/core/security.py`**

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

**Learning: Password Hashing**
- Never store plain passwords
- `bcrypt` is industry standard
- Slow by design (prevents brute force)
- Each hash is unique (even for same password)

### Day 5-7: API Endpoints

**File: `backend/app/schemas/user.py`**

```python
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: str | None = None
```

**File: `backend/app/api/auth.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token
)
from app.core.config import get_settings
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["authentication"])
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(
        select(User).where(
            (User.email == user.email) | (User.username == user.username)
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Email or username already registered"
        )
    
    # Create user
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=get_password_hash(user.password)
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.username == form_data.username)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
```

**Update `backend/app/main.py`:**

```python
from app.api import auth

app.include_router(auth.router)
```

**Test authentication:**
```bash
# Register
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"testpass123"}'

# Login
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=testpass123"

# Get current user (use token from login)
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Phase 2: Code Analysis Engine (Week 2)

### Day 8-10: Tree-sitter Integration

**Install tree-sitter language grammars:**

```bash
pip install tree-sitter-languages
```

**File: `backend/app/services/code_parser.py`**

```python
from tree_sitter_languages import get_language, get_parser
from typing import List, Dict, Any
import hashlib


class CodeParser:
    """Parse code into AST and extract meaningful information"""
    
    SUPPORTED_LANGUAGES = {
        'python': 'python',
        'javascript': 'javascript',
        'typescript': 'typescript',
        'java': 'java',
        'cpp': 'cpp',
        'c': 'c',
        'go': 'go',
        'rust': 'rust'
    }
    
    def __init__(self, language: str):
        if language not in self.SUPPORTED_LANGUAGES:
            raise ValueError(f"Unsupported language: {language}")
        
        self.language = language
        self.ts_language = get_language(self.SUPPORTED_LANGUAGES[language])
        self.parser = get_parser(self.SUPPORTED_LANGUAGES[language])
    
    def parse(self, code: str) -> Dict[str, Any]:
        """Parse code and extract structured information"""
        tree = self.parser.parse(bytes(code, "utf8"))
        root_node = tree.root_node
        
        return {
            "functions": self._extract_functions(root_node, code),
            "classes": self._extract_classes(root_node, code),
            "imports": self._extract_imports(root_node, code),
            "complexity": self._calculate_complexity(root_node),
            "summary": self._generate_summary(root_node, code)
        }
    
    def _extract_functions(self, node, code: str) -> List[Dict]:
        """Extract function definitions"""
        functions = []
        
        query_string = self._get_function_query()
        if not query_string:
            return functions
        
        query = self.ts_language.query(query_string)
        captures = query.captures(node)
        
        for capture_node, capture_name in captures:
            if capture_name == "function":
                func_info = {
                    "name": self._get_function_name(capture_node, code),
                    "params": self._get_function_params(capture_node, code),
                    "start_line": capture_node.start_point[0] + 1,
                    "end_line": capture_node.end_point[0] + 1,
                    "docstring": self._get_docstring(capture_node, code)
                }
                functions.append(func_info)
        
        return functions
    
    def _get_function_query(self) -> str:
        """Get language-specific function query"""
        queries = {
            'python': '(function_definition) @function',
            'javascript': '(function_declaration) @function',
            'typescript': '(function_declaration) @function',
            'java': '(method_declaration) @function',
            'cpp': '(function_definition) @function',
            'go': '(function_declaration) @function'
        }
        return queries.get(self.language, '')
    
    def _get_function_name(self, node, code: str) -> str:
        """Extract function name from node"""
        for child in node.children:
            if child.type == 'identifier':
                return code[child.start_byte:child.end_byte]
        return "anonymous"
    
    def _get_function_params(self, node, code: str) -> List[str]:
        """Extract function parameters"""
        params = []
        for child in node.children:
            if child.type == 'parameters':
                for param in child.children:
                    if param.type == 'identifier':
                        params.append(code[param.start_byte:param.end_byte])
        return params
    
    def _get_docstring(self, node, code: str) -> str | None:
        """Extract docstring/comment if available"""
        # Language-specific docstring extraction
        if self.language == 'python':
            for child in node.children:
                if child.type == 'block':
                    for stmt in child.children:
                        if stmt.type == 'expression_statement':
                            for expr in stmt.children:
                                if expr.type == 'string':
                                    return code[expr.start_byte:expr.end_byte].strip('"\'')
        return None
    
    def _extract_classes(self, node, code: str) -> List[Dict]:
        """Extract class definitions"""
        classes = []
        
        query_string = self._get_class_query()
        if not query_string:
            return classes
        
        query = self.ts_language.query(query_string)
        captures = query.captures(node)
        
        for capture_node, capture_name in captures:
            if capture_name == "class":
                class_info = {
                    "name": self._get_class_name(capture_node, code),
                    "start_line": capture_node.start_point[0] + 1,
                    "end_line": capture_node.end_point[0] + 1,
                    "methods": []
                }
                classes.append(class_info)
        
        return classes
    
    def _get_class_query(self) -> str:
        """Get language-specific class query"""
        queries = {
            'python': '(class_definition) @class',
            'javascript': '(class_declaration) @class',
            'typescript': '(class_declaration) @class',
            'java': '(class_declaration) @class',
            'cpp': '(class_specifier) @class'
        }
        return queries.get(self.language, '')
    
    def _get_class_name(self, node, code: str) -> str:
        """Extract class name"""
        for child in node.children:
            if child.type == 'identifier':
                return code[child.start_byte:child.end_byte]
        return "Anonymous"
    
    def _extract_imports(self, node, code: str) -> List[str]:
        """Extract import statements"""
        imports = []
        
        query_string = self._get_import_query()
        if not query_string:
            return imports
        
        query = self.ts_language.query(query_string)
        captures = query.captures(node)
        
        for capture_node, _ in captures:
            import_text = code[capture_node.start_byte:capture_node.end_byte]
            imports.append(import_text)
        
        return imports
    
    def _get_import_query(self) -> str:
        """Get language-specific import query"""
        queries = {
            'python': '(import_statement) @import',
            'javascript': '(import_statement) @import',
            'typescript': '(import_statement) @import',
            'java': '(import_declaration) @import',
            'go': '(import_declaration) @import'
        }
        return queries.get(self.language, '')
    
    def _calculate_complexity(self, node) -> int:
        """Calculate cyclomatic complexity"""
        complexity = 1  # Base complexity
        
        # Count decision points
        decision_nodes = [
            'if_statement',
            'while_statement',
            'for_statement',
            'case_statement',
            'catch_clause',
            'conditional_expression'
        ]
        
        def count_decisions(n):
            count = 0
            if n.type in decision_nodes:
                count = 1
            for child in n.children:
                count += count_decisions(child)
            return count
        
        complexity += count_decisions(node)
        return complexity
    
    def _generate_summary(self, node, code: str) -> Dict:
        """Generate code summary statistics"""
        return {
            "total_lines": node.end_point[0] + 1,
            "node_count": self._count_nodes(node),
            "max_depth": self._calculate_depth(node)
        }
    
    def _count_nodes(self, node) -> int:
        """Count total AST nodes"""
        count = 1
        for child in node.children:
            count += self._count_nodes(child)
        return count
    
    def _calculate_depth(self, node, current_depth=0) -> int:
        """Calculate maximum AST depth"""
        if not node.children:
            return current_depth
        return max(self._calculate_depth(child, current_depth + 1) 
                   for child in node.children)
    
    @staticmethod
    def get_content_hash(code: str) -> str:
        """Generate hash for caching"""
        return hashlib.sha256(code.encode()).hexdigest()
```

**Learning: Abstract Syntax Trees (AST)**
- Trees represent code structure
- Each node = syntax element (function, class, etc.)
- Queries = pattern matching on trees
- Enables deep code understanding

**Test the parser:**

```python
# File: backend/tests/test_parser.py
import pytest
from app.services.code_parser import CodeParser


def test_python_parser():
    code = '''
def calculate_sum(a, b):
    """Calculate sum of two numbers"""
    return a + b

class Calculator:
    def add(self, x, y):
        return x + y
'''
    
    parser = CodeParser('python')
    result = parser.parse(code)
    
    assert len(result['functions']) >= 1
    assert len(result['classes']) == 1
    assert result['functions'][0]['name'] == 'calculate_sum'
    assert result['classes'][0]['name'] == 'Calculator'


def test_javascript_parser():
    code = '''
function greet(name) {
    return `Hello, ${name}!`;
}

class Person {
    constructor(name) {
        this.name = name;
    }
}
'''
    
    parser = CodeParser('javascript')
    result = parser.parse(code)
    
    assert len(result['functions']) >= 1
    assert len(result['classes']) == 1
```

Run tests:
```bash
pytest tests/ -v
```

---

## Phase 3: AI Integration & Optimization (Week 2-3)

### Day 11-13: Azure OpenAI Service Integration

**File: `backend/app/services/ai_service.py`**

```python
from openai import AzureOpenAI
from app.core.config import get_settings
from app.core.cache import cache
import asyncio
from typing import Dict, List, Any
import json

settings = get_settings()


class AIDocumentationService:
    """Generate documentation using Azure OpenAI"""
    
    def __init__(self):
        self.client = AzureOpenAI(
            api_key=settings.azure_openai_key,
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint
        )
        self.gpt4_deployment = settings.azure_openai_deployment_gpt4
        self.gpt4_mini_deployment = settings.azure_openai_deployment_gpt4_mini
    
    async def generate_function_documentation(
        self,
        function_info: Dict,
        code_context: str,
        language: str
    ) -> str:
        """Generate documentation for a single function"""
        
        # Check cache first
        cache_key = cache.generate_cache_key(
            "func_doc",
            function_info.get('name'),
            code_context[:100],  # First 100 chars for context
            language
        )
        
        cached_doc = await cache.get(cache_key)
        if cached_doc:
            return cached_doc['documentation']
        
        # Generate prompt
        prompt = self._create_function_prompt(function_info, code_context, language)
        
        # Call OpenAI
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.gpt4_mini_deployment,  # Use mini for simple docs
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert code documentation generator. "
                              "Generate clear, concise documentation for functions."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        documentation = response.choices[0].message.content
        
        # Cache result
        await cache.set(cache_key, {"documentation": documentation}, expire=86400)
        
        return documentation
    
    def _create_function_prompt(
        self,
        function_info: Dict,
        code_context: str,
        language: str
    ) -> str:
        """Create prompt for function documentation"""
        
        prompt = f"""Generate documentation for this {language} function.

Function Name: {function_info.get('name')}
Parameters: {', '.join(function_info.get('params', []))}
Existing Docstring: {function_info.get('docstring', 'None')}

Code Context:
```{language}
{code_context}
```

Generate documentation that includes:
1. Brief description (1-2 sentences)
2. Parameters explanation
3. Return value description
4. Usage example (if applicable)
5. Any important notes or edge cases

Format the response in a clear, structured way."""
        
        return prompt
    
    async def generate_class_documentation(
        self,
        class_info: Dict,
        code_context: str,
        language: str
    ) -> str:
        """Generate documentation for a class"""
        
        cache_key = cache.generate_cache_key(
            "class_doc",
            class_info.get('name'),
            code_context[:100],
            language
        )
        
        cached_doc = await cache.get(cache_key)
        if cached_doc:
            return cached_doc['documentation']
        
        prompt = self._create_class_prompt(class_info, code_context, language)
        
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.gpt4_deployment,  # Use GPT-4 for complex class docs
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert software architect and technical writer. "
                              "Generate comprehensive class documentation."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=1500
        )
        
        documentation = response.choices[0].message.content
        
        await cache.set(cache_key, {"documentation": documentation}, expire=86400)
        
        return documentation
    
    def _create_class_prompt(
        self,
        class_info: Dict,
        code_context: str,
        language: str
    ) -> str:
        """Create prompt for class documentation"""
        
        prompt = f"""Generate comprehensive documentation for this {language} class.

Class Name: {class_info.get('name')}
Number of Methods: {len(class_info.get('methods', []))}

Code Context:
```{language}
{code_context}
```

Generate documentation that includes:
1. Class purpose and responsibility
2. Key methods overview
3. Usage examples
4. Design patterns used (if any)
5. Relationships with other classes

Format the response in clear markdown."""
        
        return prompt
    
    async def generate_file_summary(
        self,
        parsed_code: Dict,
        code: str,
        language: str,
        file_path: str
    ) -> str:
        """Generate high-level file summary"""
        
        cache_key = cache.generate_cache_key(
            "file_summary",
            file_path,
            str(parsed_code.get('complexity')),
            language
        )
        
        cached_summary = await cache.get(cache_key)
        if cached_summary:
            return cached_summary['summary']
        
        # Create condensed version of code for context
        summary_context = {
            "file_path": file_path,
            "language": language,
            "num_functions": len(parsed_code.get('functions', [])),
            "num_classes": len(parsed_code.get('classes', [])),
            "imports": parsed_code.get('imports', [])[:10],  # First 10 imports
            "complexity": parsed_code.get('complexity'),
            "total_lines": parsed_code.get('summary', {}).get('total_lines', 0)
        }
        
        prompt = f"""Analyze this {language} file and provide a comprehensive summary.

File: {file_path}

Statistics:
- Functions: {summary_context['num_functions']}
- Classes: {summary_context['num_classes']}
- Complexity Score: {summary_context['complexity']}
- Total Lines: {summary_context['total_lines']}

Key Imports:
{chr(10).join(summary_context['imports'][:5])}

First 50 lines of code:
```{language}
{chr(10).join(code.split(chr(10))[:50])}
```

Provide:
1. File purpose and main functionality
2. Key components (classes/functions)
3. Dependencies and imports explanation
4. Architectural role in the system
5. Complexity assessment"""
        
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.gpt4_deployment,
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior software engineer performing code review. "
                              "Provide insightful, actionable summaries."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.4,
            max_tokens=1000
        )
        
        summary = response.choices[0].message.content
        
        await cache.set(cache_key, {"summary": summary}, expire=86400)
        
        return summary
    
    async def generate_inline_comments(
        self,
        code: str,
        language: str,
        parsed_info: Dict
    ) -> str:
        """Add inline comments to code"""
        
        # For complex code, add strategic comments
        if parsed_info.get('complexity', 0) < 5:
            return code  # Simple code doesn't need extra comments
        
        prompt = f"""Add helpful inline comments to this {language} code.

Guidelines:
- Add comments for complex logic
- Explain WHY, not WHAT
- Keep comments concise
- Use proper comment syntax for {language}
- Don't over-comment obvious code

Code:
```{language}
{code}
```

Return the code with added comments:"""
        
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.gpt4_mini_deployment,
            messages=[
                {
                    "role": "system",
                    "content": "You are a code documentation expert. Add clear, helpful comments."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=2000
        )
        
        return response.choices[0].message.content
```

**Learning: Token Management**
- GPT-4 is expensive (~$0.03/1K tokens)
- GPT-4-mini is cheaper (~$0.003/1K tokens)
- Use mini for simple tasks, GPT-4 for complex
- Caching saves money on repeated queries

**Learning: Async OpenAI Calls**
- OpenAI Python SDK is synchronous
- Use `asyncio.to_thread()` to make it non-blocking
- Allows concurrent processing of multiple files

---

### Day 14: Complete Documentation Pipeline

**File: `backend/app/services/documentation_service.py`**

```python
from app.services.code_parser import CodeParser
from app.services.ai_service import AIDocumentationService
from typing import Dict, List
import asyncio


class DocumentationPipeline:
    """Orchestrates the complete documentation generation process"""
    
    def __init__(self):
        self.ai_service = AIDocumentationService()
    
    async def process_file(
        self,
        code: str,
        file_path: str,
        language: str
    ) -> Dict:
        """Process a single file through the pipeline"""
        
        try:
            # Step 1: Parse code
            parser = CodeParser(language)
            parsed_code = parser.parse(code)
            
            # Step 2: Generate documentation for functions (parallel)
            function_docs = await asyncio.gather(*[
                self.ai_service.generate_function_documentation(
                    func,
                    self._get_function_context(code, func),
                    language
                )
                for func in parsed_code['functions']
            ])
            
            # Step 3: Generate documentation for classes (parallel)
            class_docs = await asyncio.gather(*[
                self.ai_service.generate_class_documentation(
                    cls,
                    self._get_class_context(code, cls),
                    language
                )
                for cls in parsed_code['classes']
            ])
            
            # Step 4: Generate file summary
            file_summary = await self.ai_service.generate_file_summary(
                parsed_code,
                code,
                language,
                file_path
            )
            
            # Step 5: Generate inline comments (if needed)
            commented_code = code
            if parsed_code['complexity'] > 10:
                commented_code = await self.ai_service.generate_inline_comments(
                    code,
                    language,
                    parsed_code
                )
            
            # Combine results
            documentation = {
                "file_path": file_path,
                "language": language,
                "summary": file_summary,
                "functions": [
                    {**func, "documentation": doc}
                    for func, doc in zip(parsed_code['functions'], function_docs)
                ],
                "classes": [
                    {**cls, "documentation": doc}
                    for cls, doc in zip(parsed_code['classes'], class_docs)
                ],
                "complexity": parsed_code['complexity'],
                "stats": parsed_code['summary'],
                "documented_code": commented_code
            }
            
            return {
                "status": "success",
                "data": documentation
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "file_path": file_path
            }
    
    def _get_function_context(self, code: str, func_info: Dict) -> str:
        """Extract code context around a function"""
        lines = code.split('\n')
        start = max(0, func_info['start_line'] - 5)
        end = min(len(lines), func_info['end_line'] + 5)
        return '\n'.join(lines[start:end])
    
    def _get_class_context(self, code: str, class_info: Dict) -> str:
        """Extract code context for a class"""
        lines = code.split('\n')
        start = max(0, class_info['start_line'] - 3)
        end = min(len(lines), class_info['end_line'] + 3)
        return '\n'.join(lines[start:end])
    
    async def process_repository(
        self,
        files: List[Dict],
        max_concurrent: int = 5
    ) -> List[Dict]:
        """Process multiple files with concurrency control"""
        
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def process_with_semaphore(file_info):
            async with semaphore:
                return await self.process_file(
                    file_info['content'],
                    file_info['path'],
                    file_info['language']
                )
        
        results = await asyncio.gather(*[
            process_with_semaphore(file_info)
            for file_info in files
        ])
        
        return results
```

**Learning: Semaphore for Concurrency Control**
- Prevents overwhelming the API
- Limits concurrent requests
- `max_concurrent=5` = max 5 files processing at once
- Balances speed and resource usage

---

---

## Phase 4: Frontend & Polish (Week 3)

### Day 15-16: React Frontend Setup

**Initialize React Project:**

```bash
cd frontend
npx create-react-app . --template typescript
# or use Vite (faster)
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install @tanstack/react-query axios
npm install react-router-dom
npm install @heroicons/react
npm install react-dropzone
npm install prismjs @types/prismjs
npm install recharts
npm install zustand  # State management
```

**Project Structure:**

```
frontend/
├── src/
│   ├── api/          # API client
│   ├── components/   # Reusable components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom hooks
│   ├── store/        # State management
│   ├── types/        # TypeScript types
│   ├── utils/        # Utilities
│   └── styles/       # Global styles
```

**File: `frontend/src/api/client.ts`**

```typescript
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async register(email: string, username: string, password: string) {
    const response = await this.client.post('/auth/register', {
      email,
      username,
      password,
    });
    return response.data;
  }

  async login(username: string, password: string) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await this.client.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    localStorage.setItem('access_token', response.data.access_token);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Repositories
  async createRepository(name: string, files: File[]) {
    const formData = new FormData();
    formData.append('name', name);
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await this.client.post('/repositories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getRepositories() {
    const response = await this.client.get('/repositories');
    return response.data;
  }

  async getRepository(id: number) {
    const response = await this.client.get(`/repositories/${id}`);
    return response.data;
  }

  async getFileDocumentation(repositoryId: number, fileId: number) {
    const response = await this.client.get(
      `/repositories/${repositoryId}/files/${fileId}`
    );
    return response.data;
  }

  // WebSocket for real-time updates
  createWebSocket(repositoryId: number): WebSocket {
    const token = localStorage.getItem('access_token');
    const wsUrl = `ws://localhost:8000/ws/repositories/${repositoryId}?token=${token}`;
    return new WebSocket(wsUrl);
  }
}

export const apiClient = new ApiClient();
```

**Learning: API Client Pattern**
- Centralized API calls
- Interceptors for auth & error handling
- Automatic token management
- Type-safe with TypeScript

**File: `frontend/src/types/index.ts`**

```typescript
export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface Repository {
  id: number;
  name: string;
  language: string;
  total_files: number;
  processed_files: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface CodeFile {
  id: number;
  repository_id: number;
  file_path: string;
  language: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  complexity_score: number;
  documentation?: FileDocumentation;
  created_at: string;
}

export interface FileDocumentation {
  file_path: string;
  language: string;
  summary: string;
  functions: FunctionDoc[];
  classes: ClassDoc[];
  complexity: number;
  stats: CodeStats;
  documented_code: string;
}

export interface FunctionDoc {
  name: string;
  params: string[];
  start_line: number;
  end_line: number;
  documentation: string;
}

export interface ClassDoc {
  name: string;
  start_line: number;
  end_line: number;
  documentation: string;
}

export interface CodeStats {
  total_lines: number;
  node_count: number;
  max_depth: number;
}
```

**File: `frontend/src/store/authStore.ts`**

```typescript
import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, isAuthenticated: false });
  },
}));
```

**Learning: Zustand State Management**
- Simpler than Redux
- No boilerplate
- Hook-based API
- Perfect for small/medium apps

### Day 17: File Upload Component

**File: `frontend/src/components/FileUpload.tsx`**

```typescript
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter for code files
    const codeFiles = acceptedFiles.filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['py', 'js', 'ts', 'tsx', 'jsx', 'java', 'cpp', 'c', 'go', 'rs'].includes(ext || '');
    });

    setSelectedFiles((prev) => [...prev, ...codeFiles]);
    onFilesSelected([...selectedFiles, ...codeFiles]);
  }, [selectedFiles, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.cpp', '.c', '.go', '.rs'],
    },
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop code files here, or click to select'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supports: Python, JavaScript, TypeScript, Java, C++, C, Go, Rust
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Selected Files ({selectedFiles.length})
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <DocumentIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

**Learning: React Dropzone**
- Handles drag & drop elegantly
- File type filtering
- Touch-friendly for mobile
- Accessibility built-in

### Day 18: Repository Processing Page with WebSocket

**File: `frontend/src/pages/RepositoryDetail.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Repository, CodeFile } from '../types';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export const RepositoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;

    // Fetch initial data
    apiClient.getRepository(parseInt(id)).then(setRepository);

    // Setup WebSocket for real-time updates
    const ws = apiClient.createWebSocket(parseInt(id));

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'progress':
          setProgress(data.progress);
          setLogs((prev) => [...prev, data.message]);
          break;
        case 'file_completed':
          setFiles((prev) =>
            prev.map((f) =>
              f.id === data.file_id ? { ...f, status: 'completed' } : f
            )
          );
          break;
        case 'file_failed':
          setFiles((prev) =>
            prev.map((f) =>
              f.id === data.file_id ? { ...f, status: 'failed' } : f
            )
          );
          break;
        case 'completed':
          setRepository((prev) =>
            prev ? { ...prev, status: 'completed' } : null
          );
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setLogs((prev) => [...prev, 'Connection error occurred']);
    };

    return () => {
      ws.close();
    };
  }, [id]);

  if (!repository) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {repository.name}
        </h1>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Processing files...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Files</p>
            <p className="text-2xl font-bold text-gray-900">
              {repository.total_files}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Processed</p>
            <p className="text-2xl font-bold text-green-600">
              {repository.processed_files}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-2xl font-bold text-blue-600">
              {repository.status}
            </p>
          </div>
        </div>

        {/* Files List */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Files</h2>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file.file_path}
                  </p>
                  <p className="text-xs text-gray-500">
                    Complexity: {file.complexity_score}
                  </p>
                </div>
                <div>
                  {file.status === 'completed' && (
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  )}
                  {file.status === 'failed' && (
                    <XCircleIcon className="h-6 w-6 text-red-500" />
                  )}
                  {file.status === 'processing' && (
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logs */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Processing Logs
          </h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>{' '}
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Learning: WebSocket for Real-Time Updates**
- Bi-directional communication
- Server can push updates
- Better than polling
- Essential for live progress tracking

### Day 19: Documentation Viewer

**File: `frontend/src/components/CodeViewer.tsx`**

```typescript
import React, { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-go';

interface CodeViewerProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language,
  showLineNumbers = true,
}) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [code]);

  return (
    <div className="relative">
      <pre className={showLineNumbers ? 'line-numbers' : ''}>
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};
```

**File: `frontend/src/pages/FileDocumentation.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { FileDocumentation } from '../types';
import { CodeViewer } from '../components/CodeViewer';
import { Tab } from '@headlessui/react';

export const FileDocumentationPage: React.FC = () => {
  const { repositoryId, fileId } = useParams();
  const [doc, setDoc] = useState<FileDocumentation | null>(null);

  useEffect(() => {
    if (repositoryId && fileId) {
      apiClient
        .getFileDocumentation(parseInt(repositoryId), parseInt(fileId))
        .then((data) => setDoc(data.documentation));
    }
  }, [repositoryId, fileId]);

  if (!doc) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">{doc.file_path}</h1>
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
            <span>Language: {doc.language}</span>
            <span>Complexity: {doc.complexity}</span>
            <span>Lines: {doc.stats.total_lines}</span>
          </div>
        </div>

        <Tab.Group>
          <Tab.List className="flex border-b border-gray-200 px-6">
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium ${
                  selected
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              Overview
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium ${
                  selected
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              Functions
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium ${
                  selected
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              Classes
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium ${
                  selected
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              Code
            </Tab>
          </Tab.List>

          <Tab.Panels className="p-6">
            {/* Overview Tab */}
            <Tab.Panel>
              <div className="prose max-w-none">
                <h2>File Summary</h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-700">{doc.summary}</p>
                </div>

                <h3>Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Lines</p>
                    <p className="text-2xl font-bold">{doc.stats.total_lines}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Complexity</p>
                    <p className="text-2xl font-bold">{doc.complexity}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Max Depth</p>
                    <p className="text-2xl font-bold">{doc.stats.max_depth}</p>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            {/* Functions Tab */}
            <Tab.Panel>
              <div className="space-y-6">
                {doc.functions.map((func, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {func.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        Lines {func.start_line}-{func.end_line}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-sm text-gray-600">Parameters: </span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {func.params.join(', ') || 'none'}
                      </code>
                    </div>
                    <div className="prose max-w-none text-sm">
                      <p className="text-gray-700">{func.documentation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Tab.Panel>

            {/* Classes Tab */}
            <Tab.Panel>
              <div className="space-y-6">
                {doc.classes.map((cls, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {cls.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        Lines {cls.start_line}-{cls.end_line}
                      </span>
                    </div>
                    <div className="prose max-w-none text-sm">
                      <p className="text-gray-700">{cls.documentation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Tab.Panel>

            {/* Code Tab */}
            <Tab.Panel>
              <CodeViewer code={doc.documented_code} language={doc.language} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};
```

**Learning: Tabs for Organization**
- Separates different views
- Reduces cognitive load
- Better UX than long scrolling page
- Headless UI = accessible by default

---

## Backend: File Upload & WebSocket Endpoints

**File: `backend/app/api/repositories.py`**

```python
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import asyncio

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.repository import Repository, CodeFile
from app.services.documentation_service import DocumentationPipeline
from app.services.code_parser import CodeParser

router = APIRouter(prefix="/repositories", tags=["repositories"])


@router.post("/")
async def create_repository(
    name: str,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload files and create repository"""
    
    # Create repository
    repo = Repository(
        user_id=current_user.id,
        name=name,
        total_files=len(files),
        status="pending"
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)
    
    # Save files
    file_records = []
    for upload_file in files:
        content = await upload_file.read()
        content_str = content.decode('utf-8')
        
        # Detect language
        ext = upload_file.filename.split('.')[-1]
        language_map = {
            'py': 'python',
            'js': 'javascript',
            'ts': 'typescript',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'go': 'go'
        }
        language = language_map.get(ext, 'unknown')
        
        file_record = CodeFile(
            repository_id=repo.id,
            file_path=upload_file.filename,
            language=language,
            content_hash=CodeParser.get_content_hash(content_str),
            original_content=content_str,
            status="pending"
        )
        file_records.append(file_record)
    
    db.add_all(file_records)
    await db.commit()
    
    # Start async processing (don't wait for it)
    asyncio.create_task(process_repository_async(repo.id, db))
    
    return {"id": repo.id, "status": "processing", "total_files": len(files)}


async def process_repository_async(repository_id: int, db: AsyncSession):
    """Background task to process repository"""
    
    # Get repository and files
    repo_result = await db.execute(
        select(Repository).where(Repository.id == repository_id)
    )
    repo = repo_result.scalar_one()
    
    files_result = await db.execute(
        select(CodeFile).where(CodeFile.repository_id == repository_id)
    )
    files = files_result.scalars().all()
    
    # Update status
    repo.status = "processing"
    await db.commit()
    
    # Process files
    pipeline = DocumentationPipeline()
    
    for file in files:
        try:
            result = await pipeline.process_file(
                file.original_content,
                file.file_path,
                file.language
            )
            
            if result['status'] == 'success':
                file.documentation = result['data']
                file.documented_content = result['data']['documented_code']
                file.complexity_score = result['data']['complexity']
                file.status = "completed"
            else:
                file.status = "failed"
                file.error_message = result.get('error')
            
            repo.processed_files += 1
            await db.commit()
            
        except Exception as e:
            file.status = "failed"
            file.error_message = str(e)
            await db.commit()
    
    repo.status = "completed"
    await db.commit()


@router.get("/")
async def get_repositories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's repositories"""
    result = await db.execute(
        select(Repository)
        .where(Repository.user_id == current_user.id)
        .order_by(Repository.created_at.desc())
    )
    repositories = result.scalars().all()
    return repositories


@router.get("/{repository_id}")
async def get_repository(
    repository_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get repository details"""
    result = await db.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.user_id == current_user.id
        )
    )
    repo = result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get files
    files_result = await db.execute(
        select(CodeFile).where(CodeFile.repository_id == repository_id)
    )
    files = files_result.scalars().all()
    
    return {
        "repository": repo,
        "files": files
    }


@router.websocket("/ws/repositories/{repository_id}")
async def repository_websocket(
    websocket: WebSocket,
    repository_id: int,
    db: AsyncSession = Depends(get_db)
):
    """WebSocket for real-time repository processing updates"""
    await websocket.accept()
    
    try:
        while True:
            # Check repository status
            result = await db.execute(
                select(Repository).where(Repository.id == repository_id)
            )
            repo = result.scalar_one_or_none()
            
            if not repo:
                await websocket.close()
                break
            
            # Send progress update
            progress = (repo.processed_files / repo.total_files * 100) if repo.total_files > 0 else 0
            
            await websocket.send_json({
                "type": "progress",
                "progress": progress,
                "processed": repo.processed_files,
                "total": repo.total_files,
                "status": repo.status,
                "message": f"Processed {repo.processed_files}/{repo.total_files} files"
            })
            
            # If completed, send final message
            if repo.status == "completed":
                await websocket.send_json({
                    "type": "completed",
                    "message": "All files processed successfully!"
                })
                break
            
            # Wait before next update
            await asyncio.sleep(2)
            
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for repository {repository_id}")
```

**Update `backend/app/main.py`:**

```python
from app.api import repositories

app.include_router(repositories.router)
```

---

## Phase 5: Production Deployment (Week 3-4)

### Day 20-21: Docker Containerization

**File: `backend/Dockerfile`**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run with gunicorn for production
CMD ["gunicorn", "app.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

**File: `backend/requirements.txt`**

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
gunicorn==21.2.0
sqlalchemy==2.0.23
asyncpg==0.29.0
alembic==1.12.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
redis==5.0.1
openai==1.3.7
azure-identity==1.15.0
azure-storage-blob==12.19.0
tree-sitter-languages==1.8.0
pydantic-settings==2.1.0
python-dotenv==1.0.0
```

**File: `frontend/Dockerfile`**

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**File: `frontend/nginx.conf`**

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**File: `docker-compose.prod.yml`**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - app-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379/0
      AZURE_OPENAI_ENDPOINT: ${AZURE_OPENAI_ENDPOINT}
      AZURE_OPENAI_KEY: ${AZURE_OPENAI_KEY}
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      - postgres
      - redis
    networks:
      - app-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

**Learning: Multi-Stage Docker Builds**
- Reduces final image size
- Build stage has dev dependencies
- Production stage only has compiled assets
- Smaller images = faster deployments

### Day 22: Azure Deployment

**Option 1: Azure Container Apps (Easiest)**

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Create resource group
az group create --name codeexplain-rg --location eastus

# Create Azure Container Registry
az acr create --resource-group codeexplain-rg \
  --name codeexplainregistry --sku Basic

# Build and push images
az acr build --registry codeexplainregistry \
  --image codeexplain-backend:latest ./backend

az acr build --registry codeexplainregistry \
  --image codeexplain-frontend:latest ./frontend

# Create Container Apps environment
az containerapp env create \
  --name codeexplain-env \
  --resource-group codeexplain-rg \
  --location eastus

# Deploy backend
az containerapp create \
  --name codeexplain-backend \
  --resource-group codeexplain-rg \
  --environment codeexplain-env \
  --image codeexplainregistry.azurecr.io/codeexplain-backend:latest \
  --target-port 8000 \
  --ingress 'external' \
  --registry-server codeexplainregistry.azurecr.io \
  --env-vars \
    DATABASE_URL=secretref:db-url \
    REDIS_URL=secretref:redis-url \
    AZURE_OPENAI_KEY=secretref:openai-key

# Deploy frontend
az containerapp create \
  --name codeexplain-frontend \
  --resource-group codeexplain-rg \
  --environment codeexplain-env \
  --image codeexplainregistry.azurecr.io/codeexplain-frontend:latest \
  --target-port 80 \
  --ingress 'external'
```

**Option 2: Azure Kubernetes Service (More Control)**

**File: `infra/k8s/deployment.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: codeexplain-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: codeexplain-backend
  template:
    metadata:
      labels:
        app: codeexplain-backend
    spec:
      containers:
      - name: backend
        image: codeexplainregistry.azurecr.io/codeexplain-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: codeexplain-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: codeexplain-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: codeexplain-backend
spec:
  selector:
    app: codeexplain-backend
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: codeexplain-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.codeexplain.com
    secretName: codeexplain-tls
  rules:
  - host: api.codeexplain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: codeexplain-backend
            port:
              number: 8000
```

**Deploy to AKS:**

```bash
# Create AKS cluster
az aks create \
  --resource-group codeexplain-rg \
  --name codeexplain-cluster \
  --node-count 2 \
  --node-vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --attach-acr codeexplainregistry

# Get credentials
az aks get-credentials \
  --resource-group codeexplain-rg \
  --name codeexplain-cluster

# Apply manifests
kubectl apply -f infra/k8s/
```

### Day 23: CI/CD Pipeline

**File: `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

env:
  REGISTRY: codeexplainregistry.azurecr.io

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}
    
    - name: Login to ACR
      run: az acr login --name codeexplainregistry
    
    - name: Build and push backend
      run: |
        docker build -t ${{ env.REGISTRY }}/codeexplain-backend:${{ github.sha }} ./backend
        docker push ${{ env.REGISTRY }}/codeexplain-backend:${{ github.sha }}
    
    - name: Build and push frontend
      run: |
        docker build -t ${{ env.REGISTRY }}/codeexplain-frontend:${{ github.sha }} ./frontend
        docker push ${{ env.REGISTRY }}/codeexplain-frontend:${{ github.sha }}
    
    - name: Deploy to Container Apps
      run: |
        az containerapp update \
          --name codeexplain-backend \
          --resource-group codeexplain-rg \
          --image ${{ env.REGISTRY }}/codeexplain-backend:${{ github.sha }}
        
        az containerapp update \
          --name codeexplain-frontend \
          --resource-group codeexplain-rg \
          --image ${{ env.REGISTRY }}/codeexplain-frontend:${{ github.sha }}
```

**Learning: CI/CD Best Practices**
- Automated testing before deployment
- Tagged images (never use :latest in prod)
- Blue-green deployments (zero downtime)
- Rollback capability
- Environment-specific configs

---

## Phase 6: Monitoring & Optimization (Week 4)

### Day 24-25: Azure Application Insights

**File: `backend/app/core/monitoring.py`**

```python
from opencensus.ext.azure.log_exporter import AzureLogHandler
from opencensus.ext.azure import metrics_exporter
from opencensus.stats import aggregation as aggregation_module
from opencensus.stats import measure as measure_module
from opencensus.stats import stats as stats_module
from opencensus.stats import view as view_module
from opencensus.tags import tag_map as tag_map_module
import logging
import time
from functools import wraps
from app.core.config import get_settings

settings = get_settings()

# Setup logging
logger = logging.getLogger(__name__)
logger.addHandler(AzureLogHandler(
    connection_string=settings.applicationinsights_connection_string
))

# Setup metrics
stats = stats_module.stats
view_manager = stats.view_manager
stats_recorder = stats.stats_recorder

# Define measures
request_measure = measure_module.MeasureFloat(
    "request_duration",
    "Duration of requests",
    "ms"
)

ai_token_measure = measure_module.MeasureInt(
    "ai_tokens_used",
    "Number of AI tokens consumed",
    "tokens"
)

# Define views
request_view = view_module.View(
    "request_duration_view",
    "Distribution of request durations",
    [],
    request_measure,
    aggregation_module.DistributionAggregation([0, 100, 500, 1000, 5000])
)

token_view = view_module.View(
    "ai_tokens_view",
    "Sum of AI tokens used",
    [],
    ai_token_measure,
    aggregation_module.SumAggregation()
)

view_manager.register_view(request_view)
view_manager.register_view(token_view)

# Setup exporter
exporter = metrics_exporter.new_metrics_exporter(
    connection_string=settings.applicationinsights_connection_string
)
view_manager.register_exporter(exporter)


def track_performance(operation_name: str):
    """Decorator to track operation performance"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                
                duration = (time.time() - start_time) * 1000
                mmap = stats_recorder.new_measurement_map()
                tmap = tag_map_module.TagMap()
                
                mmap.measure_float_put(request_measure, duration)
                mmap.record(tmap)
                
                logger.info(
                    f"{operation_name} completed in {duration:.2f}ms",
                    extra={
                        'custom_dimensions': {
                            'operation': operation_name,
                            'duration_ms': duration
                        }
                    }
                )
                
                return result
                
            except Exception as e:
                logger.error(
                    f"{operation_name} failed: {str(e)}",
                    extra={
                        'custom_dimensions': {
                            'operation': operation_name,
                            'error': str(e)
                        }
                    }
                )
                raise
        
        return wrapper
    return decorator


def track_ai_usage(tokens: int):
    """Track AI token usage"""
    mmap = stats_recorder.new_measurement_map()
    tmap = tag_map_module.TagMap()
    
    mmap.measure_int_put(ai_token_measure, tokens)
    mmap.record(tmap)
    
    logger.info(
        f"AI tokens used: {tokens}",
        extra={
            'custom_dimensions': {
                'tokens': tokens
            }
        }
    )
```

**Update AI service to track usage:**

```python
# In app/services/ai_service.py
from app.core.monitoring import track_performance, track_ai_usage

@track_performance("generate_function_documentation")
async def generate_function_documentation(self, ...):
    # ... existing code ...
    
    response = await asyncio.to_thread(...)
    
    # Track token usage
    track_ai_usage(response.usage.total_tokens)
    
    return documentation
```

**Learning: Observability**
- Logging = what happened
- Metrics = how much/how fast
- Tracing = path through system
- All three = complete observability

### Day 26: Performance Optimization

**Database Query Optimization:**

```python
# File: backend/app/api/repositories.py (optimized)

# BAD: N+1 query problem
@router.get("/")
async def get_repositories_bad(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Repository).where(Repository.user_id == current_user.id)
    )
    repos = result.scalars().all()
    
    # This causes N queries for files
    for repo in repos:
        files_result = await db.execute(
            select(CodeFile).where(CodeFile.repository_id == repo.id)
        )
        repo.files = files_result.scalars().all()
    
    return repos


# GOOD: Use eager loading
from sqlalchemy.orm import selectinload

@router.get("/")
async def get_repositories_optimized(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Repository)
        .where(Repository.user_id == current_user.id)
        .options(selectinload(Repository.files))  # Eager load files
        .order_by(Repository.created_at.desc())
    )
    repos = result.scalars().all()
    return repos
```

**Caching Strategy Enhancement:**

```python
# File: backend/app/services/ai_service.py (enhanced caching)

async def generate_function_documentation(
    self,
    function_info: Dict,
    code_context: str,
    language: str
) -> str:
    # Multi-level cache key
    # Level 1: Exact match
    exact_cache_key = cache.generate_cache_key(
        "func_doc_exact",
        function_info.get('name'),
        code_context,
        language
    )
    
    cached_doc = await cache.get(exact_cache_key)
    if cached_doc:
        return cached_doc['documentation']
    
    # Level 2: Similar function signature match
    signature = f"{function_info.get('name')}_{len(function_info.get('params', []))}"
    similar_cache_key = cache.generate_cache_key(
        "func_doc_similar",
        signature,
        language
    )
    
    cached_similar = await cache.get(similar_cache_key)
    if cached_similar:
        # Use as template, adjust for current function
        return self._adapt_documentation(cached_similar['documentation'], function_info)
    
    # Generate new documentation
    documentation = await self._generate_new_documentation(...)
    
    # Cache at both levels
    await cache.set(exact_cache_key, {"documentation": documentation}, expire=86400)
    await cache.set(similar_cache_key, {"documentation": documentation}, expire=3600)
    
    return documentation
```

**Connection Pooling:**

```python
# File: backend/app/core/database.py (optimized)

engine = create_async_engine(
    settings.database_url,
    echo=False,  # Disable in production
    pool_size=20,  # Increased from 10
    max_overflow=40,  # Increased from 20
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections after 1 hour
    connect_args={
        "server_settings": {
            "application_name": "codeexplain",
            "jit": "off"  # Disable JIT for simple queries
        }
    }
)
```

**Rate Limiting with Redis:**

```python
# File: backend/app/core/rate_limit.py

from fastapi import HTTPException, Request
from app.core.cache import cache
import time


async def rate_limit(request: Request, max_requests: int = 20, window: int = 60):
    """Rate limiting middleware"""
    
    # Get user identifier (IP or user_id)
    identifier = request.client.host
    if hasattr(request.state, "user"):
        identifier = f"user_{request.state.user.id}"
    
    key = f"rate_limit:{identifier}"
    
    # Get current count
    current = await cache.redis.get(key)
    
    if current is None:
        # First request in window
        await cache.redis.setex(key, window, 1)
        return
    
    current = int(current)
    
    if current >= max_requests:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {window} seconds."
        )
    
    # Increment counter
    await cache.redis.incr(key)


# Usage in endpoints
from fastapi import Depends

@router.post("/repositories")
async def create_repository(
    ...,
    _: None = Depends(rate_limit)
):
    ...
```

### Day 27: Cost Optimization

**1. AI Cost Reduction Strategies**

```python
# File: backend/app/services/cost_optimizer.py

class CostOptimizer:
    """Optimize AI API costs"""
    
    @staticmethod
    def should_use_gpt4(complexity: int, file_size: int) -> bool:
        """Decide which model to use based on complexity"""
        # Use GPT-4 only for complex code
        if complexity > 15 or file_size > 500:
            return True
        return False
    
    @staticmethod
    def compress_context(code: str, max_lines: int = 100) -> str:
        """Reduce context size while preserving meaning"""
        lines = code.split('\n')
        
        if len(lines) <= max_lines:
            return code
        
        # Keep imports, function signatures, and key logic
        important_lines = []
        for line in lines:
            stripped = line.strip()
            if (stripped.startswith('import') or 
                stripped.startswith('from') or
                stripped.startswith('def') or
                stripped.startswith('class') or
                stripped.startswith('async def')):
                important_lines.append(line)
        
        # Fill remaining with evenly distributed samples
        remaining = max_lines - len(important_lines)
        step = len(lines) // remaining if remaining > 0 else 1
        
        for i in range(0, len(lines), step):
            if len(important_lines) < max_lines:
                important_lines.append(lines[i])
        
        return '\n'.join(important_lines[:max_lines])
    
    @staticmethod
    async def batch_similar_requests(requests: List[Dict]) -> List[Dict]:
        """Batch similar requests to reduce API calls"""
        # Group by language and complexity
        batches = {}
        for req in requests:
            key = f"{req['language']}_{req['complexity']//5}"
            if key not in batches:
                batches[key] = []
            batches[key].append(req)
        
        # Process batches
        results = []
        for batch in batches.values():
            if len(batch) > 1:
                # Combine into single prompt
                combined_result = await self._process_batch(batch)
                results.extend(combined_result)
            else:
                result = await self._process_single(batch[0])
                results.append(result)
        
        return results
```

**2. Database Optimization**

```python
# Add indexes for common queries
# File: alembic/versions/xxx_add_indexes.py

def upgrade():
    op.create_index(
        'ix_code_files_content_hash',
        'code_files',
        ['content_hash']
    )
    op.create_index(
        'ix_code_files_status',
        'code_files',
        ['status']
    )
    op.create_index(
        'ix_repositories_user_status',
        'repositories',
        ['user_id', 'status']
    )
```

**3. Implement Response Compression**

```python
# File: backend/app/main.py

from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

**4. CDN for Frontend Assets**

```yaml
# Update docker-compose.prod.yml to use Azure CDN

services:
  frontend:
    environment:
      - CDN_URL=https://codeexplain.azureedge.net
```

---

## Testing Strategy

### Unit Tests

**File: `backend/tests/test_code_parser.py`**

```python
import pytest
from app.services.code_parser import CodeParser

@pytest.mark.parametrize("language,code,expected_functions", [
    ("python", "def test(): pass", 1),
    ("javascript", "function test() {}", 1),
    ("java", "public void test() {}", 1),
])
def test_function_extraction(language, code, expected_functions):
    parser = CodeParser(language)
    result = parser.parse(code)
    assert len(result['functions']) == expected_functions
```

### Integration Tests

**File: `backend/tests/test_api.py`**

```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_repository():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register user
        response = await client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "testpass123"
            }
        )
        assert response.status_code == 200
        
        # Login
        response = await client.post(
            "/auth/login",
            data={"username": "testuser", "password": "testpass123"}
        )
        token = response.json()["access_token"]
        
        # Create repository
        files = [("files", ("test.py", "def test(): pass", "text/plain"))]
        response = await client.post(
            "/repositories",
            files=files,
            data={"name": "test-repo"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
```

### Load Testing

**File: `tests/load_test.py`**

```python
from locust import HttpUser, task, between

class CodeExplainUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login
        response = self.client.post("/auth/login", data={
            "username": "testuser",
            "password": "testpass123"
        })
        self.token = response.json()["access_token"]
    
    @task(3)
    def get_repositories(self):
        self.client.get(
            "/repositories",
            headers={"Authorization": f"Bearer {self.token}"}
        )
    
    @task(1)
    def create_repository(self):
        files = [("files", ("test.py", "def test(): pass"))]
        self.client.post(
            "/repositories",
            files=files,
            data={"name": "test-repo"},
            headers={"Authorization": f"Bearer {self.token}"}
        )
```

Run load tests:
```bash
locust -f tests/load_test.py --host=http://localhost:8000
```

---

## Production Checklist

### Security
- [ ] HTTPS enabled with valid certificate
- [ ] Environment variables secured (Azure Key Vault)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented
- [ ] Secrets rotation policy

### Performance
- [ ] Database indexes optimized
- [ ] Redis caching enabled
- [ ] CDN for static assets
- [ ] Response compression (gzip)
- [ ] Connection pooling configured
- [ ] Query optimization completed
- [ ] Load testing passed (>1000 req/s)

### Monitoring
- [ ] Application Insights configured
- [ ] Error tracking active
- [ ] Performance metrics dashboard
- [ ] Cost monitoring alerts
- [ ] Uptime monitoring (99.9% SLA)
- [ ] Log aggregation setup

### Backup & Recovery
- [ ] Database automated backups (daily)
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure tested
- [ ] Data retention policy defined

### Documentation
- [ ] API documentation (Swagger)
- [ ] Architecture diagrams
- [ ] Deployment runbook
- [ ] Troubleshooting guide
- [ ] User guide

---

## Cost Breakdown (Monthly Estimates)

### Development (Local)
- Azure OpenAI API: $50-150 (depending on usage)
- **Total: ~$100/month**

### Production (100 users, 1000 repos/month)
- **Azure Container Apps**: $50-150
- **Azure Database for PostgreSQL**: $25-75
- **Azure Cache for Redis**: $15-30
- **Azure OpenAI API**: $200-500 (main cost)
- **Azure Blob Storage**: $5-10
- **Azure Application Insights**: $10-20
- **Domain + SSL**: $15/year
- **Total: ~$350-800/month**

### Scaling (1000 users, 10K repos/month)
- **Container Apps (3-5 instances)**: $200-400
- **Database (scaled)**: $100-200
- **Redis (scaled)**: $50-100
- **OpenAI API (main cost)**: $2000-5000
- **Storage**: $20-50
- **Monitoring**: $50-100
- **Total: ~$2500-6000/month**

### Cost Optimization Tips
1. Aggressive caching (can reduce OpenAI costs by 60-80%)
2. Use GPT-4-mini when possible (10x cheaper)
3. Batch processing during off-peak hours
4. Reserved instances for predictable workloads
5. Auto-scaling based on demand

---

## Next Steps After Completion

### Feature Enhancements
1. **GitHub Integration**: Auto-sync with GitHub repos
2. **Team Collaboration**: Shared documentation workspace
3. **Custom AI Models**: Fine-tune on domain-specific code
4. **Diagram Generation**: Auto-generate architecture diagrams
5. **IDE Plugins**: VS Code / JetBrains integration
6. **API Access**: REST API for CI/CD integration

### Advanced Optimizations
1. **Vector Database**: Semantic code search (Pinecone/Weaviate)
2. **Code Embeddings**: Similar code detection
3. **Incremental Processing**: Only process changed files
4. **Distributed Processing**: Multi-region deployment
5. **GraphQL API**: More flexible queries

---

## Learning Resources

### Books
- "Designing Data-Intensive Applications" - Martin Kleppmann
- "FastAPI Best Practices" - Official docs
- "Python Concurrency with asyncio" - Matthew Fowler

### Online Courses
- Azure Fundamentals (AZ-900)
- Docker & Kubernetes Mastery
- React with TypeScript
- Prompt Engineering for Developers

### Documentation
- FastAPI: https://fastapi.tiangolo.com
- Azure OpenAI: https://learn.microsoft.com/azure/ai-services/openai/
- Tree-sitter: https://tree-sitter.github.io
- SQLAlchemy: https://docs.sqlalchemy.org

---

## Support & Community

### Getting Help
1. Check documentation first
2. Search Stack Overflow
3. Azure community forums
4. OpenAI developer forum

### Contributing
- Report bugs on GitHub
- Submit feature requests
- Contribute improvements
- Write tutorials

---

**Congratulations!** You now have a complete, production-ready implementation guide for CodeExplain. This project demonstrates:

✅ Full-stack development (FastAPI + React)
✅ AI/ML integration (Azure OpenAI)
✅ Cloud deployment (Azure)
✅ DevOps practices (Docker, CI/CD)
✅ Production monitoring
✅ Performance optimization
✅ Cost management

Perfect for your Microsoft application! 🚀