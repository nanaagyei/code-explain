# CodeXplain Implementation Plan

Last updated: 2026-01-15

## How to use this file

- Use this as the source of truth for scope, decisions, and risks.
- Update progress after every change set.
- Link changes to `changelog.md` entries by date.

## Update Protocol

- Every PR or batch of changes must:
  - Update the relevant checklist items in this file.
  - Append a dated entry to `changelog.md`.
  - Capture any decision or risk changes in this file.

## Decisions

- Roadmap scope: Full roadmap (Phases 1–3).
- UI direction: Professional, engaging, vibrant, indie, native style. Reduce purple gradients.
- Feature removals: AI Mentor and Bulk Operations removed from UI/API/docs.
- Quality Metrics: Simplify to single Health Score with expandable breakdown.
- Language focus: Python, JavaScript, TypeScript, Go, Rust, Java (+ optional C/C++).

## Risks & Mitigations

- Scope creep across phases.
  - Mitigation: Keep Phase 1 as a hard launch gate; defer Phase 2/3 unless explicitly scheduled.
- Breaking changes from feature removal.
  - Mitigation: Remove UI routes first, then API/service layers, then docs; add regression tests.
- UX inconsistency during redesign.
  - Mitigation: Define tokens, update shared components first, then pages.

## Phase 1: Core Polish + Removals + UX Refresh

### Removals (AI Mentor + Bulk Ops)
- [x] Remove AI Mentor routes, screens, hints, and docs
- [x] Remove Bulk Operations UI, batch jobs UI, API/services, and docs
- [x] Remove any leftover references in README/docs

### Language Scope
- [x] Frontend file filters updated to target languages
- [x] Backend parser support audited and aligned to target list
- [x] Docs updated with supported language list

### Health Score
- [x] Backend aggregation returns single Health Score + breakdown
- [x] Frontend displays Health Score and expandable details
- [x] Docs updated for Health Score model

### Start Here Summary
- [x] Backend generates repo-level "Start Here" summary
- [x] Frontend renders "Start Here" section in repository detail

### Architecture Diagrams
- [x] Add richer interactivity (selection, trace, export hooks)
- [x] Add "You Are Here" highlight state for selected file
- [x] Support export stubs (PNG/SVG/Mermaid)

### Code Review Deprioritization
- [x] Rename/reorder tab placement
- [x] Limit to top issues by severity

### UX Refresh
- [x] Define new design tokens and reduce purple gradients
- [x] Apply new system to Dashboard
- [x] Apply new system to Repository Detail
- [x] Apply new system to File Documentation

## Phase 2: Differentiators

- [x] Good First Issues matcher (API + UI)
- [x] Guided onboarding flow
- [x] Explain This Function/Class UI + API
- [x] Save & Share Explorations

## Phase 3: Growth Features

- [x] Compare two repos
- [x] Changelog explainer
- [x] Before You PR checklist
- [x] VS Code extension
- [x] CLI tool

## Phase 3.5: VS Code Extension & CLI

### VS Code Extension (`codexplain-vscode`)
- [x] Package setup with TypeScript compilation
- [x] "Analyze Current File" command with progress notification
- [x] API client with cancellation support and error handling
- [x] Results panel webview with health score display
- [x] Context menu integration (editor, explorer, title bar)
- [x] Status bar item for quick access
- [x] Copy to clipboard functionality (Markdown export)
- [x] Configuration settings (API URL, token, status bar toggle)
- [x] Language detection for supported file types
- [x] README documentation
- [x] Explain Selection feature (highlight code to explain)
- [x] Hover preview with quick function summaries
- [x] CodeLens for function complexity indicators
- [x] Quick Fix diagnostics for health score issues

### CLI Tool (`codexplain-cli`)
- [x] Commander.js CLI framework setup
- [x] `analyze <repo-url>` command with GitHub integration
- [x] `config set-key` / `config set-url` / `config show` commands
- [x] Polling for async analysis completion (`--wait` flag)
- [x] Output formatters (Markdown, JSON)
- [x] Progress indicators with colored output
- [x] Config file storage (~/.codexplain/config.json)
- [x] Environment variable support
- [x] README documentation
- [x] `file <path>` command for local file analysis
- [x] `list` command to show analyzed repositories
- [x] `status <repo-id>` command to check analysis status
- [x] `open <repo-id>` command to open in browser
- [x] `compare <file1> <file2>` command for file comparison
