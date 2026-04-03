# CodeXplain for VS Code

<p align="center">
  <strong>Understand any codebase in minutes.</strong><br>
  AI-powered file analysis with health scores, summaries, and actionable insights—right in your editor.
</p>

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Understanding Results](#understanding-results)
- [Supported Languages](#supported-languages)
- [Commands](#commands)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Development](#development)
- [License](#license)

---

## Features

### Instant Code Analysis
Get AI-powered insights about any code file in seconds. Understand what the code does, how it's structured, and where improvements can be made.

### Health Score Dashboard
See a comprehensive health score (0-100) with letter grade (A+ to F) that evaluates:
- **Readability**: How easy is the code to understand?
- **Maintainability**: How easy is it to modify and extend?
- **Security**: Are there potential vulnerabilities?
- **Performance**: Are there optimization opportunities?
- **Testability**: How easy is it to write tests?

### Beautiful Results Panel
View analysis results in a polished webview panel with:
- Color-coded health score and grade
- Visual progress bars for each metric
- AI-generated summary explaining the code
- Detailed breakdown with actionable notes

### Seamless Integration
- **Context Menu**: Right-click any file to analyze
- **Status Bar**: One-click access from the status bar
- **Command Palette**: Quick keyboard access
- **Copy to Clipboard**: Export results as Markdown

---

## Quick Start

```
1. Install the extension from VS Code Marketplace
2. Configure your API token in Settings
3. Open a code file
4. Right-click → "CodeXplain: Analyze Current File"
5. View results in the side panel
```

---

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to **Extensions** (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for **"CodeXplain"**
4. Click **Install**

### From VSIX File

1. Download the `.vsix` file from [GitHub Releases](https://github.com/codexplain/codexplain-vscode/releases)
2. In VS Code, open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
3. Type **"Extensions: Install from VSIX..."**
4. Select the downloaded `.vsix` file

### From Source

```bash
git clone https://github.com/codexplain/codexplain-vscode.git
cd codexplain-vscode
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

---

## Configuration

Open VS Code Settings (Ctrl+, / Cmd+,) and search for **"CodeXplain"**.

| Setting | Description | Default | Required |
|---------|-------------|---------|----------|
| `codexplain.apiBaseUrl` | CodeXplain API server URL | `http://localhost:8000` | Yes |
| `codexplain.apiToken` | Your API access token (Bearer) | - | Yes |
| `codexplain.showStatusBarItem` | Show CodeXplain in status bar | `true` | No |

### Getting Your API Token

1. Log in to your CodeXplain dashboard at [app.codexplain.dev](https://app.codexplain.dev)
2. Go to **Settings** → **API Keys**
3. Click **"Generate New Key"**
4. Copy the token and paste it into VS Code settings

### Example Settings (settings.json)

```json
{
  "codexplain.apiBaseUrl": "https://api.codexplain.dev",
  "codexplain.apiToken": "your-api-token-here",
  "codexplain.showStatusBarItem": true
}
```

---

## Usage

### Method 1: Command Palette

1. Open a code file in VS Code
2. Press **Ctrl+Shift+P** (Windows/Linux) or **Cmd+Shift+P** (macOS)
3. Type **"CodeXplain: Analyze Current File"**
4. Press **Enter**

### Method 2: Context Menu (Right-Click)

1. Open a code file
2. Right-click anywhere in the editor
3. Select **"CodeXplain: Analyze Current File"**

### Method 3: Status Bar

1. Look for **"CodeXplain"** in the bottom status bar
2. Click it to analyze the current file

### Method 4: Editor Title Button

1. Open a supported code file
2. Click the **search icon** in the editor title bar (top right)

### Copying Results

After analysis completes:
- Click **"Copy to Clipboard"** button in the results panel
- Or run **"CodeXplain: Copy Results to Clipboard"** from Command Palette

Results are exported as formatted Markdown, perfect for:
- Documentation
- Code reviews
- Team sharing
- Personal notes

---

## Understanding Results

### Health Score

The health score is a weighted aggregate of five metrics:

| Grade | Score Range | Meaning |
|-------|-------------|---------|
| A+ | 95-100 | Excellent code quality |
| A | 90-94 | Very good, minor improvements possible |
| A- | 85-89 | Good quality code |
| B+ | 80-84 | Above average |
| B | 75-79 | Average, some improvements recommended |
| B- | 70-74 | Below average |
| C+ | 65-69 | Needs improvement |
| C | 60-64 | Significant issues |
| C- | 55-59 | Multiple problems |
| D | 50-54 | Poor quality |
| F | Below 50 | Critical issues |

### Metrics Explained

**Readability (25% weight)**
- Code clarity and organization
- Naming conventions
- Comment quality
- Logical structure

**Maintainability (25% weight)**
- Modularity and separation of concerns
- Code duplication
- Dependency management
- Ease of modification

**Security (20% weight)**
- Input validation
- Authentication/authorization patterns
- Data handling
- Known vulnerability patterns

**Performance (15% weight)**
- Algorithm efficiency
- Resource usage
- Potential bottlenecks
- Optimization opportunities

**Testability (15% weight)**
- Function purity
- Dependency injection
- Mock-ability
- Test coverage potential

---

## Supported Languages

CodeXplain provides deep analysis for these languages:

| Language | Extensions | Status |
|----------|------------|--------|
| Python | `.py` | Full Support |
| JavaScript | `.js`, `.jsx` | Full Support |
| TypeScript | `.ts`, `.tsx` | Full Support |
| Java | `.java` | Full Support |
| Go | `.go` | Full Support |
| Rust | `.rs` | Full Support |
| C | `.c`, `.h` | Full Support |
| C++ | `.cpp`, `.hpp`, `.cc`, `.cxx` | Full Support |

Other file types will show an "Unsupported file type" message.

---

## Commands

| Command | Description |
|---------|-------------|
| `CodeXplain: Analyze Current File` | Analyze the currently open file |
| `CodeXplain: Copy Results to Clipboard` | Copy last analysis as Markdown |

---

## Keyboard Shortcuts

By default, no keyboard shortcuts are assigned. To add your own:

1. Open **Keyboard Shortcuts** (Ctrl+K Ctrl+S / Cmd+K Cmd+S)
2. Search for **"CodeXplain"**
3. Click the **+** icon to add a keybinding

**Suggested shortcuts:**

```json
{
  "key": "ctrl+shift+a",
  "command": "codexplain.analyzeCurrentFile",
  "when": "editorTextFocus"
}
```

---

## Troubleshooting

### "API URL not configured"

**Solution**: Set the `codexplain.apiBaseUrl` setting to your CodeXplain server URL.

```json
{
  "codexplain.apiBaseUrl": "https://api.codexplain.dev"
}
```

### "Unauthorized" or "401" error

**Causes**:
- Invalid API token
- Expired API token
- Missing API token

**Solution**: Generate a new token from your CodeXplain dashboard and update the `codexplain.apiToken` setting.

### "Unsupported file type"

**Cause**: The file extension is not in the supported languages list.

**Solution**: CodeXplain only supports Python, JavaScript, TypeScript, Java, C/C++, Go, and Rust files.

### Analysis is slow

**Causes**:
- Large file size
- Complex code structure
- Network latency
- Server load

**Solution**: 
- Wait for the progress notification to complete
- For very large files, consider analyzing specific sections
- Check your network connection

### Results panel doesn't appear

**Causes**:
- Panel was closed
- Extension error

**Solution**:
1. Run the analyze command again
2. Check the Output panel for errors (View → Output → select "CodeXplain")
3. Reload VS Code window (Ctrl+Shift+P → "Reload Window")

### "Cannot connect to API"

**Causes**:
- Server is down
- Incorrect URL
- Network/firewall issues

**Solution**:
1. Verify the API URL is correct
2. Check if the server is running
3. Test the URL in a browser: `https://your-api-url/health`

---

## FAQ

### Q: Is my code sent to external servers?

A: Yes, your code is sent to the CodeXplain API for analysis. If you're using a self-hosted instance, the code stays within your infrastructure. We do not store or share your code beyond the analysis session.

### Q: How much does it cost?

A: CodeXplain uses a credit-based system. Check your dashboard for current pricing. You can also use your own OpenAI API key to reduce costs.

### Q: Can I analyze private repositories?

A: Yes, the extension analyzes whatever file is open in VS Code. It doesn't access your repository directly—it only sends the current file content.

### Q: Does it work offline?

A: No, the extension requires an internet connection to communicate with the CodeXplain API.

### Q: How accurate is the health score?

A: The health score is generated using AI analysis and should be used as a guide, not an absolute measure. It's most useful for identifying areas of improvement and tracking code quality over time.

### Q: Can I customize the analysis?

A: Currently, the analysis uses standard prompts. Custom prompt templates are available in the web application for repository-level analysis.

---

## Development

### Prerequisites

- Node.js 18+
- npm 9+
- VS Code 1.90+

### Setup

```bash
# Clone the repository
git clone https://github.com/codexplain/codexplain-vscode.git
cd codexplain-vscode

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch
```

### Testing

Press **F5** in VS Code to open a new Extension Development Host window with the extension loaded.

### Building

```bash
# Compile for production
npm run vscode:prepublish

# Package as VSIX
npm run package
```

### Project Structure

```
codexplain-vscode/
├── src/
│   ├── extension.ts          # Extension entry point
│   ├── api/
│   │   └── client.ts         # API client
│   ├── commands/
│   │   └── analyzeCurrentFile.ts  # Main command
│   ├── panels/
│   │   └── ResultsPanel.ts   # Webview panel
│   └── utils/
│       └── language.ts       # Language detection
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript config
└── README.md
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/codexplain/codexplain-vscode/blob/main/CONTRIBUTING.md) for details.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Links

- [CodeXplain Web App](https://app.codexplain.dev)
- [Documentation](https://docs.codexplain.dev)
- [GitHub Repository](https://github.com/codexplain/codexplain-vscode)
- [Issue Tracker](https://github.com/codexplain/codexplain-vscode/issues)
- [Changelog](CHANGELOG.md)
