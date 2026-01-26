# Command Line Interface (CLI)

The CodeXplain CLI lets you analyze GitHub repositories, local files, changelogs, and more directly from your terminal. Perfect for automation, CI/CD pipelines, and quick analysis.

## Installation

```bash
# Install globally
npm install -g codexplain-cli

# Or use npx (no install required)
npx codexplain-cli --help
```

## Quick Start

```bash
# 1. Set your API token
codexplain config set-key YOUR_API_TOKEN

# 2. Analyze a repository
codexplain analyze https://github.com/owner/repo --wait
```

## Commands

### `codexplain analyze <repo-url>`

Analyze a GitHub repository.

```bash
codexplain analyze https://github.com/fastapi/fastapi --wait
```

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Format: `markdown` or `json` | `markdown` |
| `--max-files` | `-m` | Max files to analyze | `100` |
| `--wait` | `-w` | Wait for completion | `false` |
| `--quiet` | `-q` | Minimal output | `false` |

### `codexplain file <path>`

Analyze a local code file (no GitHub required).

```bash
codexplain file ./src/main.py
```

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Format: `markdown` or `json` | `markdown` |
| `--quiet` | `-q` | Minimal output | `false` |

### `codexplain list`

List your analyzed repositories.

```bash
codexplain list
```

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Format: `table` or `json` | `table` |
| `--limit` | `-l` | Max results | `20` |

### `codexplain status <repoId>`

Check the status of a repository analysis.

```bash
codexplain status 42
```

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Format: `table` or `json` | `table` |
| `--watch` | `-w` | Poll until complete | `false` |

### `codexplain open <repoId>`

Open a repository in the CodeXplain web app.

```bash
codexplain open 42
```

| Option | Description |
|--------|-------------|
| `--url-only` | Print URL instead of opening browser |

### `codexplain compare <file1> <file2>`

Compare two local code files.

```bash
codexplain compare ./src/old.py ./src/new.py
```

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Format: `markdown` or `json` | `markdown` |
| `--quiet` | `-q` | Minimal output | `false` |

### `codexplain changelog <repoId>`

Explain a changelog or commit history in plain language. Read from a file or stdin.

```bash
codexplain changelog 42 --file CHANGELOG.md
cat CHANGELOG.md | codexplain changelog 42
```

| Option | Short | Description |
|--------|-------|-------------|
| `--file` | `-f` | Path to changelog file (use `-` for stdin) |
| `--output` | `-o` | Format: `markdown` or `json` |
| `--out` | | Write result to file instead of stdout |
| `--quiet` | `-q` | Minimal output |

### `codexplain pr-checklist <repoId>`

Generate a pre-PR checklist for a repository.

```bash
codexplain pr-checklist 42
```

| Option | Short | Description |
|--------|-------|-------------|
| `--output` | `-o` | Format: `markdown` or `json` |
| `--out` | | Write result to file instead of stdout |
| `--quiet` | `-q` | Minimal output |

### `codexplain compare-repos <repoId1> <repoId2>`

Compare two analyzed repositories.

```bash
codexplain compare-repos 42 99
```

| Option | Short | Description |
|--------|-------|-------------|
| `--output` | `-o` | Format: `markdown` or `json` |
| `--out` | | Write result to file instead of stdout |
| `--quiet` | `-q` | Minimal output |

### `codexplain config`

Manage configuration.

```bash
codexplain config set-key YOUR_TOKEN
codexplain config set-url https://api.codexplain.dev
codexplain config show
```

## Configuration

Configuration is stored in `~/.codexplain/config.json`.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CODEXPLAIN_API_BASE_URL` | Override API URL |

Environment variables take precedence over config file.

## Output Formats

### Markdown (default)

Human-readable output with:
- Repository overview
- "Start Here" summary
- File list with complexity
- Individual file summaries

### JSON

Full structured response for automation:

```bash
codexplain analyze https://github.com/owner/repo --wait -o json > analysis.json
```

### Output to file (`--out`)

Commands that produce report-style output (`changelog`, `pr-checklist`, `compare-repos`, and JSON output) support `--out <path>` to write results to a file instead of stdout:

```bash
codexplain changelog 42 --file CHANGELOG.md --out changelog-explained.md
codexplain pr-checklist 42 --out checklist.md
codexplain compare-repos 42 99 --out comparison.md
```

## Examples

### Analyze a local file

```bash
codexplain file ./src/main.py
codexplain file ./lib/utils.ts -o json
```

### List repositories

```bash
codexplain list
codexplain list -l 10 -o json
```

### Changelog and PR checklist

```bash
codexplain changelog 42 --file CHANGELOG.md --out explained.md
codexplain pr-checklist 42 --out pre-pr.md
```

### Compare repos

```bash
codexplain compare-repos 42 99 --out diff.md
```

### Save analyze output to file

```bash
codexplain analyze https://github.com/owner/repo --wait > analysis.md
```

### Limit files

```bash
codexplain analyze https://github.com/kubernetes/kubernetes --max-files 50 --wait
```

### Parse with jq

```bash
codexplain analyze https://github.com/owner/repo --wait -o json | jq '.repository.status'
codexplain analyze https://github.com/owner/repo --wait -o json | jq '.files[].file_path'
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Install CodeXplain
  run: npm install -g codexplain-cli

- name: Analyze
  run: |
    codexplain config set-key ${{ secrets.CODEXPLAIN_API_TOKEN }}
    codexplain analyze https://github.com/${{ github.repository }} --wait
```

### GitLab CI

```yaml
analyze:
  script:
    - npm install -g codexplain-cli
    - codexplain config set-key $CODEXPLAIN_API_TOKEN
    - codexplain analyze $CI_PROJECT_URL --wait
```

## Troubleshooting

### No API token
Run `codexplain config set-key YOUR_TOKEN`

### Cannot connect
Check API URL with `codexplain config show`

### Analysis failed
- Verify repo is public
- Check repo has supported file types
- Try with `--max-files 50`

## Supported Languages

Python, JavaScript, TypeScript, Java, Go, Rust, C, C++

## Links

- [GitHub Repository](https://github.com/codexplain/codexplain-cli)
- [npm Package](https://www.npmjs.com/package/codexplain-cli)
- [Full README](https://github.com/codexplain/codexplain-cli#readme)
