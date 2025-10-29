import redis.asyncio as redis
from app.core.config import get_settings
import json
import hashlib
from typing import Any, Optional

settings = get_settings()


class RedisCache:
    """
    Async Redis cache manager for caching AI responses and other data.
    
    Features:
    - Async operations for better performance
    - JSON serialization/deserialization
    - Hash-based cache key generation
    - Configurable expiration times
    """
    
    def __init__(self):
        self.redis: Optional[redis.Redis] = None
    
    async def connect(self):
        """Establish connection to Redis server"""
        self.redis = await redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True
        )
        print(f"✓ Connected to Redis at {settings.redis_url}")
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            print("✓ Disconnected from Redis")
    
    async def get(self, key: str) -> Optional[dict]:
        """
        Get value from cache by key.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value as dict, or None if not found
        """
        if not self.redis:
            return None
        
        value = await self.redis.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return None
        return None
    
    async def set(self, key: str, value: dict, expire: int = 3600):
        """
        Set value in cache with expiration.
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON-serializable)
            expire: Expiration time in seconds (default: 1 hour)
        """
        if not self.redis:
            return
        
        await self.redis.set(
            key,
            json.dumps(value),
            ex=expire
        )
    
    async def delete(self, key: str):
        """Delete key from cache"""
        if not self.redis:
            return
        await self.redis.delete(key)
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        if not self.redis:
            return False
        return await self.redis.exists(key) > 0
    
    def generate_cache_key(self, prefix: str, *args) -> str:
        """
        Generate consistent cache key from prefix and arguments.
        
        Args:
            prefix: Cache key prefix (e.g., 'func_doc', 'file_summary')
            *args: Variable arguments to include in key
            
        Returns:
            MD5 hash of the combined key components
            
        Example:
            cache.generate_cache_key('func_doc', 'my_function', 'python')
            # Returns: 'a1b2c3d4e5f6...'
        """
        content = f"{prefix}:" + ":".join(str(arg) for arg in args)
        return hashlib.md5(content.encode()).hexdigest()


# Global cache instance
cache = RedisCache()
