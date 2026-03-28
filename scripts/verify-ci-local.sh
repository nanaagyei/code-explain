#!/usr/bin/env bash
# Mirror .github/workflows/ci.yml locally before push.
#
# Branch protection (merge gate, not "block opening PR"): GitHub repo Settings ->
# Branches -> Add rule for `dev` -> Require status checks -> enable: backend, frontend,
# cli, vscode-extension (job names from the CI workflow).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== backend =="
(
  cd backend
  python3 -m pip install -r requirements.txt
  python3 -m pytest tests -q
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
