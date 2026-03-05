from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import get_settings
from app.core.cache import cache
from app.core.database import engine, Base
from app.core.database import AsyncSessionLocal
from app.core.rate_limit import limiter, rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import asyncio
from app.api import (
    auth,
    repositories,
    chat,
    prompt_templates,
    user_api_keys,
    code_analysis,
    billing,
    integrations,
    webhooks,
    analytics,
    collaboration,
)
from app.services.integrations_service import process_due_webhook_deliveries

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events:
    - Startup: Connect to Redis, create database tables
    - Shutdown: Close connections gracefully
    """
    # Startup
    print("🚀 Starting CodeXplain API...")
    print(f"   Environment: {settings.env}")
    print(f"   Debug mode: {settings.debug}")
    
    # Connect to Redis
    await cache.connect()
    
    # Create database tables
    async with engine.begin() as conn:
        # In production, use Alembic migrations instead
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Database tables created/verified")
    
    print("✓ CodeXplain API is ready!\n")
    
    stop_worker = asyncio.Event()

    async def webhook_worker():
        while not stop_worker.is_set():
            try:
                async with AsyncSessionLocal() as db:
                    await process_due_webhook_deliveries(db, limit=50)
            except Exception as e:
                print(f"Webhook worker error: {e}")
            try:
                await asyncio.wait_for(stop_worker.wait(), timeout=15.0)
            except asyncio.TimeoutError:
                continue

    worker_task = asyncio.create_task(webhook_worker())

    yield
    
    # Shutdown
    print("\n🛑 Shutting down CodeXplain API...")
    stop_worker.set()
    try:
        await worker_task
    except Exception:
        pass
    await cache.disconnect()
    await engine.dispose()
    print("✓ Cleanup complete")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="AI-powered code documentation generation system",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(repositories.router)
app.include_router(chat.router)
app.include_router(prompt_templates.router)
app.include_router(user_api_keys.router)
app.include_router(code_analysis.router)
app.include_router(billing.router)
app.include_router(integrations.router)
app.include_router(webhooks.router)
app.include_router(analytics.router)
app.include_router(collaboration.router)


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Welcome endpoint"""
    return {
        "message": "Welcome to CodeXplain API",
        "version": "1.0.0",
        "docs": "/docs"
    }


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint for monitoring.
    
    Returns system status including:
    - API status
    - Database connectivity
    - Redis connectivity
    """
    health_status = {
        "status": "healthy",
        "api": "operational",
        "environment": settings.env
    }
    
    # Check Redis connection
    try:
        if cache.redis:
            await cache.redis.ping()
            health_status["redis"] = "connected"
        else:
            health_status["redis"] = "not connected"
    except Exception as e:
        health_status["redis"] = f"error: {str(e)}"
    
    # Check database connection
    try:
        async with engine.connect() as conn:
            health_status["database"] = "connected"
    except Exception as e:
        health_status["database"] = f"error: {str(e)}"
    
    return health_status


# API info endpoint
@app.get("/api/info", tags=["info"])
async def api_info():
    """Get API information and available endpoints"""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "environment": settings.env,
        "features": [
            "Multi-language code parsing (Python, JavaScript)",
            "AI-powered documentation generation",
            "Real-time processing with WebSocket",
            "Intelligent caching for cost optimization"
        ]
    }
