#!/usr/bin/env bash
# Mirror .github/workflows/ci.yml locally before push.
#
# Branch protection (merge gate): GitHub repo Settings -> Branches -> rule for `dev`
# -> Require status checks -> backend, frontend, cli, vscode-extension.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BACKEND_PY=()
if [[ -x "$ROOT/backend/.venv/bin/python" ]]; then
  BACKEND_PY=("$ROOT/backend/.venv/bin/python")
elif command -v python3.11 >/dev/null 2>&1; then
  BACKEND_PY=(python3.11)
else
  BACKEND_PY=(python3)
fi

PIP() { "${BACKEND_PY[@]}" -m pip "$@"; }
PYTEST() { "${BACKEND_PY[@]}" -m pytest "$@"; }

echo "== backend (python: ${BACKEND_PY[*]}) =="
(
  cd backend
  PIP install -r requirements.txt
  PYTEST tests -q
)

echo "== frontend =="
(
  cd frontend
  npm ci
  npm run lint
  npm run test
  npm run build
)

echo "== codexplain-cli =="
(
  cd codexplain-cli
  npm ci
  npm run test
)

echo "== codexplain-vscode =="
(
  cd codexplain-vscode
  npm ci
  npm run test
)

echo "All CI steps passed locally."
