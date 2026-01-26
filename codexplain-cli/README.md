# CodeXplain CLI

<p align="center">
  <strong>Understand any GitHub repository in minutes.</strong><br>
  AI-powered code analysis from your terminal.
</p>

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Commands](#commands)
- [Output Formats](#output-formats)
- [Examples](#examples)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Development](#development)
- [License](#license)

---

## Features

### GitHub Repository Analysis
Analyze any public GitHub repository with a single command. Get comprehensive insights including:
- **Start Here Summary**: What the project does, how it's structured, where to start reading
- **File Analysis**: Every file analyzed with language detection and complexity scoring
- **AI Summaries**: Plain-English explanations of what each file does

### Flexible Output
- **Markdown**: Human-readable output perfect for documentation
- **JSON**: Machine-readable output for scripting and automation

### Progress Tracking
- Real-time progress indicators with colored output
- Wait for analysis completion with `--wait` flag
- Background processing for large repositories

### Easy Configuration
- Simple config file stored in `~/.codexplain/`
- Environment variable support for CI/CD
- One-time API key setup

---

## Quick Start

```bash
# 1. Install the CLI
npm install -g codexplain-cli

# 2. Configure your API token
codexplain config set-key YOUR_API_TOKEN

# 3. Analyze a repository
codexplain analyze https://github.com/fastapi/fastapi --wait
```

---

## Installation

### Global Installation (Recommended)

```bash
npm install -g codexplain-cli
```

### Using npx (No Installation)

```bash
npx codexplain-cli analyze https://github.com/owner/repo --wait
```

### From Source

```bash
git clone https://github.com/codexplain/codexplain-cli.git
cd codexplain-cli
npm install
npm run build
npm link  # Makes 'codexplain' available globally
```

### Verify Installation

```bash
codexplain --version
# Output: 0.1.0
```

---

## Configuration

### Setting Your API Token

Your API token authenticates requests to the CodeXplain API.

```bash
# Get your token from https://app.codexplain.dev/settings/api-keys
codexplain config set-key YOUR_API_TOKEN
```

**Token is stored in**: `~/.codexplain/config.json`

### Setting Custom API URL

If you're self-hosting CodeXplain or using a different server:

```bash
codexplain config set-url https://api.your-domain.com
```

### Viewing Configuration

```bash
codexplain config show
```

**Output**:
```
CodeXplain Configuration
========================
Config file: /home/user/.codexplain/config.json
API URL: https://api.codexplain.dev
API Key: ****abc123

Environment overrides:
CODEXPLAIN_API_BASE_URL: (not set)
```

### Environment Variables

Environment variables override config file settings:

| Variable | Description |
|----------|-------------|
| `CODEXPLAIN_API_BASE_URL` | Override the API base URL |

**Example**:
```bash
export CODEXPLAIN_API_BASE_URL=https://api.codexplain.dev
codexplain analyze https://github.com/owner/repo --wait
```

### Config File Format

`~/.codexplain/config.json`:
```json
{
  "apiToken": "your-api-token",
  "apiBaseUrl": "https://api.codexplain.dev"
}
```

---

## Commands

### `codexplain analyze <repo-url>`

Analyze a GitHub repository.

**Syntax**:
```bash
codexplain analyze <github-url> [options]
```

**Options**:

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output <format>` | `-o` | Output format: `markdown` or `json` | `markdown` |
| `--max-files <n>` | `-m` | Maximum files to analyze | `100` |
| `--wait` | `-w` | Wait for analysis to complete | `false` |
| `--quiet` | `-q` | Minimal output (no progress) | `false` |

**Examples**:

```bash
# Basic analysis (starts background processing)
codexplain analyze https://github.com/expressjs/express

# Wait for completion and show full results
codexplain analyze https://github.com/expressjs/express --wait

# Limit to 50 files
codexplain analyze https://github.com/kubernetes/kubernetes --max-files 50 --wait

# Output as JSON
codexplain analyze https://github.com/owner/repo --wait --output json

# Quiet mode for scripts
codexplain analyze https://github.com/owner/repo --wait --quiet
```

---

### `codexplain config set-key <key>`

Set your API authentication token.

```bash
codexplain config set-key sk_live_abc123xyz
```

**Output**:
```
✓ API key saved to ~/.codexplain/config.json
```

---

### `codexplain config set-url <url>`

Set a custom API base URL.

```bash
codexplain config set-url https://api.codexplain.dev
```

**Output**:
```
✓ API URL set to: https://api.codexplain.dev
```

---

### `codexplain config show`

Display current configuration.

```bash
codexplain config show
```

---

### `codexplain --help`

Show help information.

```bash
codexplain --help
codexplain analyze --help
codexplain config --help
```

---

## Output Formats

### Markdown (Default)

Human-readable Markdown output with sections:

```markdown
# repository-name

**Status:** completed
**Files:** 15/15
**Source:** https://github.com/owner/repo

---

## Start Here

### What is this project?
A brief description of what the project does...

### What problem does it solve?
The problem this project addresses...

### How is it structured?
Overview of the folder structure...

### Where should I start reading?
- `src/main.py`
- `src/core/engine.py`
- `src/api/routes.py`

---

## Files

### Analyzed (15)

| File | Language | Complexity |
|------|----------|------------|
| `src/main.py` | python | low |
| `src/core/engine.py` | python | medium |
...

### File Summaries

#### src/main.py

This file serves as the entry point for the application...
```

### JSON

Full JSON response for programmatic use:

```json
{
  "repository": {
    "id": 123,
    "name": "repository-name",
    "status": "completed",
    "total_files": 15,
    "processed_files": 15,
    "url": "https://github.com/owner/repo"
  },
  "files": [
    {
      "id": 456,
      "file_path": "src/main.py",
      "language": "python",
      "status": "completed",
      "documentation": {
        "summary": "Entry point for the application...",
        "functions": [...],
        "classes": [...]
      }
    }
  ],
  "start_here": {
    "project_summary": "...",
    "problem_solved": "...",
    "structure_overview": "...",
    "entry_points": ["src/main.py", "..."]
  }
}
```

---

## Examples

### Analyze and Save to File

```bash
# Save Markdown output
codexplain analyze https://github.com/tiangolo/fastapi --wait > fastapi-analysis.md

# Save JSON output
codexplain analyze https://github.com/tiangolo/fastapi --wait -o json > fastapi.json
```

### Analyze Multiple Repositories

```bash
#!/bin/bash
repos=(
  "https://github.com/expressjs/express"
  "https://github.com/fastify/fastify"
  "https://github.com/koajs/koa"
)

for repo in "${repos[@]}"; do
  name=$(basename "$repo")
  echo "Analyzing $name..."
  codexplain analyze "$repo" --wait --quiet > "${name}-analysis.md"
done
```

### Quick Status Check

```bash
# Submit for analysis without waiting
codexplain analyze https://github.com/owner/repo

# Output shows repository ID for later reference
# Repository created: owner/repo (ID: 123)
# Status: processing
```

### Parse JSON Output with jq

```bash
# Get just the start_here summary
codexplain analyze https://github.com/owner/repo --wait -o json | jq '.start_here'

# List all file paths
codexplain analyze https://github.com/owner/repo --wait -o json | jq '.files[].file_path'

# Get repository status
codexplain analyze https://github.com/owner/repo --wait -o json | jq '.repository.status'
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Analyze Repository

on:
  push:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - name: Install CodeXplain CLI
        run: npm install -g codexplain-cli

      - name: Configure API
        run: |
          codexplain config set-key ${{ secrets.CODEXPLAIN_API_TOKEN }}
          codexplain config set-url https://api.codexplain.dev

      - name: Analyze Repository
        run: |
          codexplain analyze https://github.com/${{ github.repository }} \
            --wait --output json > analysis.json

      - name: Upload Analysis
        uses: actions/upload-artifact@v3
        with:
          name: code-analysis
          path: analysis.json
```

### GitLab CI

```yaml
analyze:
  image: node:18
  script:
    - npm install -g codexplain-cli
    - codexplain config set-key $CODEXPLAIN_API_TOKEN
    - codexplain analyze $CI_PROJECT_URL --wait > analysis.md
  artifacts:
    paths:
      - analysis.md
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    environment {
        CODEXPLAIN_API_TOKEN = credentials('codexplain-token')
    }
    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g codexplain-cli'
                sh 'codexplain config set-key $CODEXPLAIN_API_TOKEN'
            }
        }
        stage('Analyze') {
            steps {
                sh 'codexplain analyze https://github.com/owner/repo --wait > analysis.md'
            }
        }
    }
    post {
        always {
            archiveArtifacts artifacts: 'analysis.md'
        }
    }
}
```

### Shell Script for Automation

```bash
#!/bin/bash
set -e

# Configuration
API_TOKEN="${CODEXPLAIN_API_TOKEN:-}"
REPO_URL="$1"
OUTPUT_DIR="${2:-.}"

# Validate inputs
if [[ -z "$API_TOKEN" ]]; then
    echo "Error: CODEXPLAIN_API_TOKEN not set"
    exit 1
fi

if [[ -z "$REPO_URL" ]]; then
    echo "Usage: $0 <github-url> [output-dir]"
    exit 1
fi

# Configure CLI
codexplain config set-key "$API_TOKEN"

# Run analysis
REPO_NAME=$(basename "$REPO_URL")
echo "Analyzing $REPO_NAME..."

codexplain analyze "$REPO_URL" --wait --output json > "$OUTPUT_DIR/${REPO_NAME}.json"

# Check result
STATUS=$(jq -r '.repository.status' "$OUTPUT_DIR/${REPO_NAME}.json")
if [[ "$STATUS" == "completed" ]]; then
    echo "✓ Analysis completed successfully"
    exit 0
else
    echo "✗ Analysis failed with status: $STATUS"
    exit 1
fi
```

---

## Troubleshooting

### "No API token configured"

**Solution**: Run `codexplain config set-key YOUR_TOKEN`

### "Invalid GitHub URL"

**Cause**: URL must be a full GitHub repository URL

**Solution**: Use format `https://github.com/owner/repo`

### "Cannot connect to CodeXplain API"

**Causes**:
- Server is down
- Incorrect API URL
- Network issues

**Solutions**:
1. Check API URL: `codexplain config show`
2. Test server: `curl https://your-api-url/health`
3. Check network connectivity

### "Unauthorized" or "401" error

**Cause**: Invalid or expired API token

**Solution**: Generate a new token and run `codexplain config set-key NEW_TOKEN`

### "Analysis timed out"

**Cause**: Very large repository taking too long

**Solution**: 
- Reduce `--max-files` option
- Check if server is responsive
- Try again later

### "Repository analysis failed"

**Causes**:
- Invalid repository URL
- Private repository (not supported)
- Repository has no supported files

**Solution**: Verify the repository is public and contains supported file types

### Progress bar not showing

**Cause**: Terminal doesn't support ANSI escape codes

**Solution**: Use `--quiet` flag or pipe to a file

---

## FAQ

### Q: Which repositories can I analyze?

A: Currently, only public GitHub repositories are supported. Private repository support requires authentication and is planned for a future release.

### Q: How long does analysis take?

A: Depends on repository size. Small repos (< 50 files): ~1-2 minutes. Large repos (100+ files): ~5-10 minutes. Use `--max-files` to limit scope.

### Q: Is my code stored?

A: Code is processed and analyzed, then the analysis results are stored. Raw code is not permanently stored. Self-hosted instances give you full control.

### Q: What languages are supported?

A: Python, JavaScript, TypeScript, Java, Go, Rust, C, and C++.

### Q: Can I analyze local repositories?

A: Not yet. Local file analysis is planned for a future release. Currently, you must push to GitHub first.

### Q: How do credits work?

A: Each analysis consumes credits based on the number of files and complexity. Check your dashboard for usage and pricing.

### Q: Can I use my own OpenAI API key?

A: Yes, configure this in the web dashboard to use your own key and reduce costs.

---

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/codexplain/codexplain-cli.git
cd codexplain-cli
npm install
npm run build
```

### Running Locally

```bash
node dist/index.js --help
node dist/index.js analyze https://github.com/owner/repo --wait
```

### Project Structure

```
codexplain-cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── api/
│   │   └── client.ts         # API client
│   ├── commands/
│   │   ├── auth.ts           # Config commands
│   │   └── githubAnalyze.ts  # Analyze command
│   ├── output/
│   │   └── formatters.ts     # Output formatters
│   └── types.d.ts            # Type declarations
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
npm run build
```

### Publishing to npm

```bash
npm version patch  # or minor, major
npm publish
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/codexplain/codexplain-cli/blob/main/CONTRIBUTING.md).

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Links

- [CodeXplain Web App](https://app.codexplain.dev)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=codexplain.codexplain-vscode)
- [Documentation](https://docs.codexplain.dev)
- [GitHub Repository](https://github.com/codexplain/codexplain-cli)
- [Issue Tracker](https://github.com/codexplain/codexplain-cli/issues)
