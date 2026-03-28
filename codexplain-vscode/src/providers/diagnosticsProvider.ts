import * as vscode from 'vscode';

export interface HealthScoreData {
  score: number;
  grade: string;
  summary: string;
  metrics: Record<string, number>;
  breakdown: Record<string, string>;
}

export interface AnalysisResultForDiagnostics {
  filePath: string;
  language: string;
  summary: string;
  healthScore: HealthScoreData;
}

// Store for dismissed diagnostics (per session)
const dismissedDiagnostics = new Set<string>();

// Diagnostic collection instance
let diagnosticCollection: vscode.DiagnosticCollection;

export function createDiagnosticCollection(): vscode.DiagnosticCollection {
  if (!diagnosticCollection) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('codexplain');
  }
  return diagnosticCollection;
}

export function getDiagnosticCollection(): vscode.DiagnosticCollection {
  return diagnosticCollection;
}

export function updateDiagnosticsFromAnalysis(
  document: vscode.TextDocument,
  result: AnalysisResultForDiagnostics
): void {
  const config = vscode.workspace.getConfiguration('codexplain');
  const enableDiagnostics = config.get<boolean>('enableDiagnostics', true);
  
  if (!enableDiagnostics || !diagnosticCollection) {
    return;
  }

  const threshold = config.get<number>('diagnosticSeverityThreshold', 70);
  const diagnostics: vscode.Diagnostic[] = [];

  // Create diagnostics for each metric that's below threshold
  for (const [metric, score] of Object.entries(result.healthScore.metrics)) {
    const metricKey = `${document.uri.toString()}:${metric}`;
    
    // Skip if dismissed
    if (dismissedDiagnostics.has(metricKey)) {
      continue;
    }

    if (score < threshold) {
      const severity = getSeverity(score);
      const metricName = formatMetricName(metric);
      const breakdown = result.healthScore.breakdown[metric] || '';

      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0), // File-level diagnostic
        `${metricName}: ${score.toFixed(0)}/100 - ${breakdown || 'Needs improvement'}`,
        severity
      );

      diagnostic.source = 'CodeXplain';
      diagnostic.code = {
        value: metric,
        target: vscode.Uri.parse(`codexplain://metric/${metric}`)
      };

      // Store additional data for quick fixes
      (diagnostic as any).codexplainData = {
        metric,
        score,
        breakdown,
        fullSummary: result.summary,
        healthScore: result.healthScore
      };

      diagnostics.push(diagnostic);
    }
  }

  // Add overall health score diagnostic if below threshold
  if (result.healthScore.score < threshold) {
    const overallKey = `${document.uri.toString()}:overall`;
    
    if (!dismissedDiagnostics.has(overallKey)) {
      const severity = getSeverity(result.healthScore.score);
      
      const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        `Overall Health Score: ${result.healthScore.grade} (${result.healthScore.score.toFixed(0)}/100) - ${result.healthScore.summary}`,
        severity
      );

      diagnostic.source = 'CodeXplain';
      diagnostic.code = {
        value: 'overall',
        target: vscode.Uri.parse('codexplain://metric/overall')
      };

      (diagnostic as any).codexplainData = {
        metric: 'overall',
        score: result.healthScore.score,
        breakdown: result.healthScore.summary,
        fullSummary: result.summary,
        healthScore: result.healthScore
      };

      diagnostics.push(diagnostic);
    }
  }

  diagnosticCollection.set(document.uri, diagnostics);
}

export function clearDiagnostics(document: vscode.TextDocument): void {
  if (diagnosticCollection) {
    diagnosticCollection.delete(document.uri);
  }
}

export function clearAllDiagnostics(): void {
  if (diagnosticCollection) {
    diagnosticCollection.clear();
  }
}

export function dismissDiagnostic(documentUri: string, metric: string): void {
  dismissedDiagnostics.add(`${documentUri}:${metric}`);
}

function getSeverity(score: number): vscode.DiagnosticSeverity {
  if (score < 50) {
    return vscode.DiagnosticSeverity.Error;
  } else if (score < 70) {
    return vscode.DiagnosticSeverity.Warning;
  } else if (score < 85) {
    return vscode.DiagnosticSeverity.Information;
  }
  return vscode.DiagnosticSeverity.Hint;
}

function formatMetricName(metric: string): string {
  return metric
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Code Action Provider for Quick Fixes
 */
export class CodeXplainCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    // Find CodeXplain diagnostics
    const codexplainDiagnostics = context.diagnostics.filter(
      d => d.source === 'CodeXplain'
    );

    for (const diagnostic of codexplainDiagnostics) {
      const data = (diagnostic as any).codexplainData;
      if (!data) continue;

      // Action 1: View full analysis
      const viewAction = new vscode.CodeAction(
        'View Full CodeXplain Analysis',
        vscode.CodeActionKind.QuickFix
      );
      viewAction.command = {
        command: 'codexplain.analyzeCurrentFile',
        title: 'View Full Analysis'
      };
      viewAction.diagnostics = [diagnostic];
      viewAction.isPreferred = true;
      actions.push(viewAction);

      // Action 2: Copy improvement suggestions
      const copyAction = new vscode.CodeAction(
        'Copy Improvement Suggestions',
        vscode.CodeActionKind.QuickFix
      );
      copyAction.command = {
        command: 'codexplain.copyImprovementSuggestions',
        title: 'Copy Suggestions',
        arguments: [data]
      };
      copyAction.diagnostics = [diagnostic];
      actions.push(copyAction);

      // Action 3: Dismiss this warning
      const dismissAction = new vscode.CodeAction(
        'Dismiss This Warning',
        vscode.CodeActionKind.QuickFix
      );
      dismissAction.command = {
        command: 'codexplain.dismissDiagnostic',
        title: 'Dismiss Warning',
        arguments: [document.uri.toString(), data.metric]
      };
      dismissAction.diagnostics = [diagnostic];
      actions.push(dismissAction);
    }

    return actions;
  }
}

/**
 * Register commands for quick fix actions
 */
export function registerDiagnosticCommands(context: vscode.ExtensionContext): void {
  // Command to copy improvement suggestions
  const copyCommand = vscode.commands.registerCommand(
    'codexplain.copyImprovementSuggestions',
    async (data: any) => {
      if (!data) {
        vscode.window.showWarningMessage('No analysis data available.');
        return;
      }

      const suggestions: string[] = [
        `# CodeXplain Improvement Suggestions`,
        '',
        `## ${formatMetricName(data.metric)}`,
        `**Score:** ${data.score.toFixed(0)}/100`,
        '',
        `### Issue`,
        data.breakdown || 'No specific details available.',
        '',
        `### Full Analysis Summary`,
        data.fullSummary || 'Run a full analysis for more details.',
        ''
      ];

      // Add metric-specific suggestions
      const specificSuggestions = getMetricSuggestions(data.metric, data.score);
      if (specificSuggestions.length > 0) {
        suggestions.push('### Suggested Improvements');
        specificSuggestions.forEach(s => suggestions.push(`- ${s}`));
      }

      await vscode.env.clipboard.writeText(suggestions.join('\n'));
      vscode.window.showInformationMessage('Improvement suggestions copied to clipboard.');
    }
  );

  // Command to dismiss a diagnostic
  const dismissCommand = vscode.commands.registerCommand(
    'codexplain.dismissDiagnostic',
    (documentUri: string, metric: string) => {
      dismissDiagnostic(documentUri, metric);
      
      // Refresh diagnostics for the document
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.uri.toString() === documentUri) {
        const currentDiagnostics = diagnosticCollection.get(editor.document.uri);
        if (currentDiagnostics) {
          const filtered = currentDiagnostics.filter(d => {
            const data = (d as any).codexplainData;
            return !data || data.metric !== metric;
          });
          diagnosticCollection.set(editor.document.uri, filtered);
        }
      }
      
      vscode.window.showInformationMessage(`Dismissed ${formatMetricName(metric)} warning for this session.`);
    }
  );

  context.subscriptions.push(copyCommand, dismissCommand);
}

function getMetricSuggestions(metric: string, score: number): string[] {
  const suggestions: string[] = [];

  switch (metric.toLowerCase()) {
    case 'readability':
      suggestions.push('Add descriptive variable and function names');
      suggestions.push('Break long functions into smaller, focused ones');
      suggestions.push('Add comments for complex logic');
      suggestions.push('Use consistent formatting and indentation');
      break;

    case 'maintainability':
      suggestions.push('Reduce code duplication (DRY principle)');
      suggestions.push('Extract reusable functions or modules');
      suggestions.push('Reduce coupling between components');
      suggestions.push('Add or improve documentation');
      break;

    case 'security':
      suggestions.push('Validate all user inputs');
      suggestions.push('Use parameterized queries for database access');
      suggestions.push('Avoid hardcoded credentials or secrets');
      suggestions.push('Implement proper error handling');
      break;

    case 'performance':
      suggestions.push('Review loops for optimization opportunities');
      suggestions.push('Consider caching frequently accessed data');
      suggestions.push('Avoid unnecessary object creation');
      suggestions.push('Profile code to identify bottlenecks');
      break;

    case 'testability':
      suggestions.push('Use dependency injection for better mockability');
      suggestions.push('Keep functions pure when possible');
      suggestions.push('Separate side effects from business logic');
      suggestions.push('Add unit tests for critical functionality');
      break;

    case 'overall':
      if (score < 50) {
        suggestions.push('Consider refactoring this file - it has multiple quality issues');
        suggestions.push('Break the file into smaller, focused modules');
      } else if (score < 70) {
        suggestions.push('Address the most critical issues first');
        suggestions.push('Focus on improving the lowest-scoring metrics');
      }
      break;
  }

  return suggestions;
}
