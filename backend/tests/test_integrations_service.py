import os

os.environ["DEBUG"] = "true"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["OPENAI_API_KEY"] = "test"

from app.services.integrations_service import normalize_weights, build_webhook_signature


def test_normalize_weights_returns_unit_sum():
    weights = normalize_weights(
        {
            "readability": 2,
            "maintainability": 2,
            "security": 2,
            "performance": 2,
            "testability": 2,
        }
    )
    assert round(sum(weights.values()), 6) == 1.0


def test_build_webhook_signature_format():
    sig = build_webhook_signature("secret", {"a": 1})
    assert sig.startswith("sha256=")
    assert len(sig) > 20
