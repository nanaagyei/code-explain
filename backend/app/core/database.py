from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import get_settings

settings = get_settings()

# Ensure the URL uses asyncpg driver for async operations
database_url = settings.database_url
if database_url.startswith("postgresql://") and "+asyncpg" not in database_url:
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgresql+psycopg2://"):
    database_url = database_url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)

# Create async engine for PostgreSQL
engine = create_async_engine(
    database_url,
    echo=settings.debug,  # Log SQL queries in debug mode
    future=True,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=10,  # Connection pool size
    max_overflow=20  # Max connections beyond pool_size
)

# Session factory for creating database sessions
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Don't expire objects after commit
    autocommit=False,
    autoflush=False
)

# Base class for all database models
Base = declarative_base()


# Dependency for getting database sessions in FastAPI endpoints
async def get_db():
    """
    Database session dependency for FastAPI.
    
    Usage in endpoints:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
