# VS Code Extension

CodeXplain for VS Code brings AI-powered code analysis directly into your editor. Analyze any file instantly and get health scores, summaries, and actionable insights without leaving VS Code.

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to **Extensions** (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for **"CodeXplain"**
4. Click **Install**

### From VSIX

Download the latest `.vsix` from [GitHub Releases](https://github.com/codexplain/codexplain-vscode/releases) and install via:
- Command Palette → "Extensions: Install from VSIX..."

## Configuration

After installation, configure the extension in VS Code Settings:

| Setting | Description | Required |
|---------|-------------|----------|
| `codexplain.apiBaseUrl` | CodeXplain API URL | Yes |
| `codexplain.apiToken` | Your API token | Yes |
| `codexplain.showStatusBarItem` | Show status bar button | No |
| `codexplain.enableHoverHints` | Show quick hints when hovering over functions | No |
| `codexplain.enableCodeLens` | Show complexity indicators above functions and classes | No |
| `codexplain.enableDiagnostics` | Show health score issues as VS Code diagnostics (warnings/errors) | No |
| `codexplain.diagnosticSeverityThreshold` | Show diagnostics for metrics below this score (0–100) | No |
| `codexplain.webAppUrl` | Web app URL for "Open in CodeXplain" (default: `http://localhost:5173`) | No |

### Getting Your API Token

1. Log in to [CodeXplain](https://app.codexplain.dev)
2. Go to **Settings** → **API Keys**
3. Click **Generate New Key**
4. Copy and paste into VS Code settings

## Usage

### Analyze a File

**Option 1: Command Palette**
1. Open a code file
2. Press Ctrl+Shift+P (Cmd+Shift+P on macOS)
3. Type "CodeXplain: Analyze Current File"
4. Press Enter

**Option 2: Right-Click Context Menu**
1. Right-click in the editor
2. Select "CodeXplain: Analyze Current File"

**Option 3: Status Bar**
1. Click "CodeXplain" in the bottom status bar

### Explain Selection

Get an AI-powered explanation of selected code. The response streams into a new editor tab.

1. Select the code you want explained (e.g. a function or block)
2. Right-click → **"CodeXplain: Explain Selection"** or use the Command Palette
3. Wait for the streaming explanation to complete

Supports the same languages as file analysis. You can cancel an in-flight request from the progress UI.

### Results Panel: Copy and Open in CodeXplain

After analysis, the results panel offers:

- **Copy to Clipboard** — Export results as Markdown
- **Open in CodeXplain** — Open the CodeXplain web app in your browser (uses `codexplain.webAppUrl`). Useful to explore the full repo, diagrams, or export options.

## Understanding Results

### Health Score

A weighted score (0-100) with letter grade (A+ to F):

| Grade | Meaning |
|-------|---------|
| A+ to A- | Excellent to good quality |
| B+ to B- | Above average to below average |
| C+ to C- | Needs improvement |
| D to F | Poor quality, critical issues |

### Metrics

- **Readability** (25%): Code clarity, naming, comments
- **Maintainability** (25%): Modularity, duplication, dependencies
- **Security** (20%): Vulnerabilities, data handling
- **Performance** (15%): Efficiency, bottlenecks
- **Testability** (15%): Function purity, mock-ability

## Supported Languages

| Language | Extensions |
|----------|------------|
| Python | `.py` |
| JavaScript | `.js`, `.jsx` |
| TypeScript | `.ts`, `.tsx` |
| Java | `.java` |
| Go | `.go` |
| Rust | `.rs` |
| C/C++ | `.c`, `.h`, `.cpp`, `.hpp` |

## Troubleshooting

### API URL not configured
Set `codexplain.apiBaseUrl` in VS Code settings.

### Unauthorized error
Your API token may be invalid. Generate a new one from the dashboard.

### Unsupported file type
The extension only supports the languages listed above.

## Commands

| Command | Description |
|---------|-------------|
| `CodeXplain: Analyze Current File` | Analyze the open file |
| `CodeXplain: Explain Selection` | Explain selected code (streaming) |
| `CodeXplain: Copy Results to Clipboard` | Copy last analysis |

The results panel also provides an **Open in CodeXplain** button to open the web app.

## Links

- [GitHub Repository](https://github.com/codexplain/codexplain-vscode)
- [Issue Tracker](https://github.com/codexplain/codexplain-vscode/issues)
- [Full README](https://github.com/codexplain/codexplain-vscode#readme)
