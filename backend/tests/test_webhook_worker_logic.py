import os
from datetime import datetime, timezone

os.environ["DEBUG"] = "true"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["OPENAI_API_KEY"] = "test"

from app.services.integrations_service import _mark_delivery_retry


def test_mark_delivery_retry_moves_to_retrying():
    class DeliveryStub:
        def __init__(self):
            self.event_name = "repository.completed"
            self.payload = {}
            self.status = "queued"
            self.attempt_count = 1
            self.created_at = datetime.now(timezone.utc)
            self.next_attempt_at = None
            self.last_error = None

    delivery = DeliveryStub()
    _mark_delivery_retry(delivery, "boom")
    assert delivery.status == "retrying"
    assert delivery.next_attempt_at is not None
    assert delivery.last_error == "boom"


def test_mark_delivery_retry_dead_letter_after_max_attempts():
    class DeliveryStub:
        def __init__(self):
            self.event_name = "repository.completed"
            self.payload = {}
            self.status = "queued"
            self.attempt_count = 10
            self.created_at = datetime.now(timezone.utc)
            self.next_attempt_at = None
            self.last_error = None

    delivery = DeliveryStub()
    _mark_delivery_retry(delivery, "boom")
    assert delivery.status == "dead_letter"
    assert delivery.next_attempt_at is None
