import os

import pytest

os.environ["DEBUG"] = "true"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["OPENAI_API_KEY"] = "test"

pytest.importorskip("redis")

from app.services.github_service import GitHubService


class _MockResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


class _MockClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return None

    async def get(self, url, headers=None, params=None):
        if "/pulls/" in url and "/files" not in url:
            return _MockResponse(
                {
                    "title": "PR title",
                    "body": "desc",
                    "html_url": "https://example/pr/1",
                    "head": {"sha": "abc"},
                    "base": {"sha": "def"},
                }
            )
        if params and params.get("page") == 1:
            return _MockResponse(
                [
                    {
                        "filename": "a.py",
                        "status": "modified",
                        "additions": 10,
                        "deletions": 2,
                        "changes": 12,
                        "patch": "@@ -1 +1 @@",
                    }
                ]
            )
        return _MockResponse([])


@pytest.mark.asyncio
async def test_fetch_pull_request_files_parses_payload(monkeypatch):
    monkeypatch.setattr("app.services.github_service.httpx.AsyncClient", _MockClient)
    data = await GitHubService.fetch_pull_request_files("o", "r", 1)
    assert data["title"] == "PR title"
    assert data["changed_files"] == 1
    assert data["files"][0]["filename"] == "a.py"
