from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App
    app_name: str = "CodeExplain"
    env: str = "development"
    debug: bool = True
    secret_key: str
    
    # Database
    database_url: str
    
    # Redis
    redis_url: str
    
    # OpenAI API
    openai_api_key: str
    openai_model_gpt4: str = "gpt-4o"
    openai_model_gpt4_mini: str = "gpt-4o-mini"
    
    # Security
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    access_token_expire_minutes: int = 30
    
    # Rate Limiting
    rate_limit_per_minute: int = 20
    max_file_size_mb: int = 10
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Using @lru_cache ensures settings are only loaded once
    from the .env file, improving performance.
    """
    return Settings()
