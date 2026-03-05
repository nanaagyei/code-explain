# Developer Tools

CodeXplain provides multiple ways to access code analysis beyond the web application. Use these tools to integrate CodeXplain into your development workflow.

## Available Tools

### VS Code Extension

Analyze code files directly in your editor. Get instant health scores, AI summaries, and detailed metrics without leaving VS Code.

**Best for:**
- Quick file-level analysis
- Individual developers
- Real-time code quality feedback

[Learn more →](./vscode-extension.md)

### Command Line Interface (CLI)

Analyze GitHub repositories from your terminal. Perfect for automation and CI/CD integration.

**Best for:**
- Repository-wide analysis
- CI/CD pipelines
- Scripting and automation
- Team workflows

[Learn more →](./cli.md)

## Feature Comparison

| Feature | Web App | VS Code | CLI |
|---------|---------|---------|-----|
| File Analysis | ✓ | ✓ | ✓ |
| Repository Analysis | ✓ | - | ✓ |
| Health Score | ✓ | ✓ | ✓ |
| Architecture Diagrams | ✓ | - | - |
| Good First Issues | ✓ | - | - |
| Compare Repos | ✓ | - | ✓ |
| Explain Selection | - | ✓ | - |
| Open in CodeXplain | - | ✓ | - |
| Export Markdown | ✓ | ✓ | ✓ |
| Export JSON | ✓ | - | ✓ |
| CI/CD Integration | - | - | ✓ |
| Offline Support | - | - | - |

## Getting Your API Token

All tools require an API token for authentication:

1. Log in to [CodeXplain](https://app.codexplain.dev)
2. Go to **Settings** → **API Keys**
3. Click **Generate New Key**
4. Copy the token

## API Rate Limits

| Plan | Requests/Hour | Files/Analysis |
|------|---------------|----------------|
| Free | 10 | 50 |
| Pro | 100 | 200 |
| Team | 500 | 500 |

## Supported Languages

All tools support the same languages:

- Python (`.py`)
- JavaScript (`.js`, `.jsx`)
- TypeScript (`.ts`, `.tsx`)
- Java (`.java`)
- Go (`.go`)
- Rust (`.rs`)
- C/C++ (`.c`, `.h`, `.cpp`, `.hpp`)

## Current Status

- **VS Code Repository Overview**: Available via `CodeXplain: Analyze Repository`.
- **JetBrains Plugin**: Planned roadmap item.
- **GitHub App**: Minimal webhook + PR analysis endpoints available in backend API; full marketplace install flow is planned.
