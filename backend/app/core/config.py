from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App
    app_name: str = "CodeXplain"
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
    auth_rate_limit_per_minute: int = 15
    upload_rate_limit_per_minute: int = 10
    analysis_rate_limit_per_minute: int = 20
    webhook_rate_limit_per_minute: int = 120
    rate_limit_storage_uri: str | None = None
    max_file_size_mb: int = 10

    # Quality profile defaults (weights must sum to 1.0 in runtime validation)
    default_weight_readability: float = 0.25
    default_weight_maintainability: float = 0.25
    default_weight_security: float = 0.20
    default_weight_performance: float = 0.15
    default_weight_testability: float = 0.15

    # GitHub integration
    github_app_id: str | None = None
    github_app_private_key: str | None = None
    github_webhook_secret: str | None = None
    github_api_token: str | None = None

    # Outbound webhooks
    webhook_signing_secret: str | None = None
    webhook_max_attempts: int = 5

    # Stripe / Billing
    stripe_secret_key: str | None = None
    stripe_publishable_key: str | None = None
    stripe_webhook_secret: str | None = None
    stripe_checkout_success_url: str = "http://localhost:5173/billing/success"
    stripe_checkout_cancel_url: str = "http://localhost:5173/billing/cancel"
    billing_tokens_per_credit: int = 1000
    billing_estimated_cost_per_credit_cents: int = 150
    
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
