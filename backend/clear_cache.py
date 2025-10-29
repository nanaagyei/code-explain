#!/usr/bin/env python3
"""
Clear Redis cache for code analysis features.
"""
import asyncio
import redis.asyncio as redis
from app.core.config import get_settings

async def clear_cache():
    """Clear all cache entries related to code analysis."""
    settings = get_settings()
    
    # Connect to Redis
    redis_client = await redis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True
    )
    
    # Get all keys
    keys = await redis_client.keys("*")
    print(f"Found {len(keys)} cache keys")
    
    # Clear all keys
    if keys:
        await redis_client.delete(*keys)
        print(f"Cleared {len(keys)} cache entries")
    else:
        print("No cache entries to clear")
    
    # Close connection
    await redis_client.close()
    print("Cache cleared successfully!")

if __name__ == "__main__":
    asyncio.run(clear_cache())
