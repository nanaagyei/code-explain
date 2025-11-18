#!/bin/sh
set -e

# Read environment variables (Railway makes them available during build)
export DOCS_SITE_URL=${DOCS_SITE_URL:-https://nanaagyei.github.io}
export DOCS_BASE_URL=${DOCS_BASE_URL:-/code-explain/}

echo "Building Docusaurus with:"
echo "  DOCS_SITE_URL=${DOCS_SITE_URL}"
echo "  DOCS_BASE_URL=${DOCS_BASE_URL}"

# Build the documentation
npm run build

