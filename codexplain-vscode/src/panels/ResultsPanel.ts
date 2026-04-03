import * as vscode from 'vscode';

interface HealthScoreData {
  score: number;
  grade: string;
  summary: string;
  metrics: Record<string, number>;
  breakdown: Record<string, string>;
}

interface ResultsPayload {
  filePath: string;
  language: string;
  summary: string;
  healthScore: HealthScoreData;
}

export class ResultsPanel {
  public static currentPanel: ResultsPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private currentPayload: ResultsPayload;

  private constructor(panel: vscode.WebviewPanel, payload: ResultsPayload) {
    this.panel = panel;
    this.currentPayload = payload;
    this.panel.webview.html = this.renderHtml(payload);

    this.panel.onDidDispose(() => {
      ResultsPanel.currentPanel = undefined;
    });

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'copy') {
        await vscode.commands.executeCommand('codexplain.copyResults');
      }
      if (message.command === 'openInCodeXplain') {
        const config = vscode.workspace.getConfiguration('codexplain');
        const url = config.get<string>('webAppUrl') || 'http://localhost:5173';
        await vscode.env.openExternal(vscode.Uri.parse(url));
      }
    });
  }

  static render(extensionUri: vscode.Uri, payload: ResultsPayload) {
    if (ResultsPanel.currentPanel) {
      ResultsPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
      ResultsPanel.currentPanel.currentPayload = payload;
      ResultsPanel.currentPanel.panel.webview.html = ResultsPanel.currentPanel.renderHtml(payload);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'codexplainResults',
      'CodeXplain Results',
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    ResultsPanel.currentPanel = new ResultsPanel(panel, payload);
  }

  private getGradeColor(grade: string): string {
    const gradeColors: Record<string, string> = {
      'A+': '#059669', A: '#10b981', 'A-': '#34d399',
      'B+': '#3b82f6', B: '#60a5fa', 'B-': '#93c5fd',
      'C+': '#f59e0b', C: '#fbbf24', 'C-': '#fcd34d',
      'D+': '#f97316', D: '#fb923c', 'D-': '#fdba74',
      F: '#ef4444'
    };
    return gradeColors[grade] || '#6b7280';
  }

  private renderHtml(payload: ResultsPayload) {
    const gradeColor = this.getGradeColor(payload.healthScore.grade);

    const metricsRows = Object.entries(payload.healthScore.metrics)
      .map(([key, value]) => {
        const barWidth = Math.min(100, Math.max(0, value));
        const barColor = value >= 80 ? '#10b981' : value >= 60 ? '#3b82f6' : value >= 40 ? '#f59e0b' : '#ef4444';
        return `<tr>
          <td class="metric-name">${escapeHtml(formatMetricName(key))}</td>
          <td class="metric-score">
            <div class="score-bar-container">
              <div class="score-bar" style="width: ${barWidth}%; background: ${barColor};"></div>
            </div>
            <span class="score-value">${value.toFixed(0)}</span>
          </td>
          <td class="metric-notes">${escapeHtml(payload.healthScore.breakdown[key] ?? '')}</td>
        </tr>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CodeXplain Results</title>
    <style>
      :root {
        --vscode-font-family: var(--vscode-editor-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      }
      body {
        font-family: var(--vscode-font-family);
        padding: 20px;
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
        line-height: 1.6;
      }
      .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 16px;
      }
      .file-info {
        flex: 1;
        min-width: 200px;
      }
      h1 {
        font-size: 18px;
        margin: 0 0 4px 0;
        color: var(--vscode-foreground);
        word-break: break-all;
      }
      .language-badge {
        display: inline-block;
        padding: 2px 8px;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        border-radius: 4px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .score-card {
        text-align: center;
        padding: 16px 24px;
        background: var(--vscode-editor-inactiveSelectionBackground);
        border-radius: 8px;
        min-width: 120px;
      }
      .score-value-large {
        font-size: 36px;
        font-weight: 700;
        color: ${gradeColor};
        line-height: 1;
      }
      .score-label {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        margin-top: 4px;
      }
      .grade-badge {
        display: inline-block;
        padding: 4px 12px;
        background: ${gradeColor};
        color: white;
        border-radius: 4px;
        font-weight: 600;
        font-size: 14px;
        margin-top: 8px;
      }
      .section {
        margin-top: 24px;
      }
      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--vscode-foreground);
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--vscode-panel-border);
      }
      .summary-text {
        white-space: pre-wrap;
        font-size: 13px;
        color: var(--vscode-foreground);
        background: var(--vscode-textBlockQuote-background);
        padding: 12px;
        border-radius: 4px;
        border-left: 3px solid ${gradeColor};
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      th {
        text-align: left;
        padding: 8px;
        background: var(--vscode-editor-inactiveSelectionBackground);
        font-weight: 600;
        border-bottom: 1px solid var(--vscode-panel-border);
      }
      td {
        padding: 10px 8px;
        border-bottom: 1px solid var(--vscode-panel-border);
        vertical-align: middle;
      }
      .metric-name {
        font-weight: 500;
        white-space: nowrap;
      }
      .metric-score {
        width: 140px;
      }
      .score-bar-container {
        display: inline-block;
        width: 80px;
        height: 8px;
        background: var(--vscode-progressBar-background);
        border-radius: 4px;
        overflow: hidden;
        vertical-align: middle;
        margin-right: 8px;
      }
      .score-bar {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      .score-value {
        font-weight: 600;
        font-size: 12px;
      }
      .metric-notes {
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
      }
      .actions {
        margin-top: 20px;
        display: flex;
        gap: 8px;
      }
      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-family: inherit;
        transition: opacity 0.2s;
      }
      .btn:hover {
        opacity: 0.9;
      }
      .btn-primary {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
      }
      .btn-secondary {
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="file-info">
        <h1>${escapeHtml(payload.filePath)}</h1>
        <span class="language-badge">${escapeHtml(payload.language)}</span>
      </div>
      <div class="score-card">
        <div class="score-value-large">${payload.healthScore.score.toFixed(0)}</div>
        <div class="score-label">Health Score</div>
        <div class="grade-badge">Grade ${escapeHtml(payload.healthScore.grade)}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Health Summary</div>
      <div class="summary-text">${escapeHtml(payload.healthScore.summary)}</div>
    </div>

    <div class="section">
      <div class="section-title">AI Analysis</div>
      <div class="summary-text">${escapeHtml(payload.summary)}</div>
    </div>

    <div class="section">
      <div class="section-title">Metrics Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Score</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${metricsRows}
        </tbody>
      </table>
    </div>

    <div class="actions">
      <button class="btn btn-primary" onclick="copyResults()">Copy to Clipboard</button>
      <button class="btn btn-secondary" onclick="openInCodeXplain()">Open in CodeXplain</button>
    </div>

    <script>
      const vscode = acquireVsCodeApi();
      function copyResults() {
        vscode.postMessage({ command: 'copy' });
      }
      function openInCodeXplain() {
        vscode.postMessage({ command: 'openInCodeXplain' });
      }
    </script>
  </body>
</html>`;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMetricName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
