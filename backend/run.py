"""
Development server runner for CodeExplain API.

Usage:
    python run.py
"""
import subprocess
import sys
from pathlib import Path

import uvicorn

if __name__ == "__main__":
    backend_root = Path(__file__).resolve().parent
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=backend_root,
        check=True,
    )
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info",
    )
