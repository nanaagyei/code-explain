from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker, AsyncEngine
from sqlalchemy.orm import declarative_base
from typing import Optional
import os

# Base class for all database models (needed by Alembic, doesn't require engine)
Base = declarative_base()

# Global variables for lazy initialization
_engine: Optional[AsyncEngine] = None
_AsyncSessionLocal: Optional[async_sessionmaker] = None


def _get_database_url() -> str:
    """Get and normalize database URL with asyncpg driver."""
    # Try to get from Settings first, fallback to environment variable
    try:
        from app.core.config import get_settings
        settings = get_settings()
        database_url = settings.database_url
    except Exception:
        # Fallback to environment variable directly if Settings fails
        database_url = os.getenv("DATABASE_URL", "")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is required")
    
    # Ensure the URL uses asyncpg driver for async operations
    if database_url.startswith("postgresql://") and "+asyncpg" not in database_url:
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql+psycopg2://"):
        database_url = database_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
    
    return database_url


def _get_engine() -> AsyncEngine:
    """Get or create the database engine (lazy initialization)."""
    global _engine
    if _engine is None:
        try:
            from app.core.config import get_settings
            settings = get_settings()
            debug = settings.debug
        except Exception:
            debug = os.getenv("DEBUG", "False").lower() == "true"
        
        database_url = _get_database_url()
        
        # Create async engine for PostgreSQL
        _engine = create_async_engine(
            database_url,
            echo=debug,  # Log SQL queries in debug mode
            future=True,
            pool_pre_ping=True,  # Verify connections before using them
            pool_size=10,  # Connection pool size
            max_overflow=20  # Max connections beyond pool_size
        )
    return _engine


def _get_async_session_local() -> async_sessionmaker:
    """Get or create the session factory (lazy initialization)."""
    global _AsyncSessionLocal
    if _AsyncSessionLocal is None:
        engine = _get_engine()
        _AsyncSessionLocal = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,  # Don't expire objects after commit
            autocommit=False,
            autoflush=False
        )
    return _AsyncSessionLocal


# Module-level accessors that initialize lazily
def __getattr__(name: str):
    """Lazy initialization of engine and AsyncSessionLocal."""
    if name == "engine":
        return _get_engine()
    elif name == "AsyncSessionLocal":
        return _get_async_session_local()
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")


# Dependency for getting database sessions in FastAPI endpoints
async def get_db():
    """
    Database session dependency for FastAPI.
    
    Usage in endpoints:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    session_factory = _get_async_session_local()
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
