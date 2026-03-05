from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import get_settings

settings = get_settings()


def key_func(request: Request) -> str:
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        token_fingerprint = auth[-16:]
        return f"bearer:{token_fingerprint}"
    return get_remote_address(request)


limiter = Limiter(
    key_func=key_func,
    storage_uri=settings.rate_limit_storage_uri or settings.redis_url,
    headers_enabled=True,
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please retry later.",
            "error": "rate_limited",
        },
    )
