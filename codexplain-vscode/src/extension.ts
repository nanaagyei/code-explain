import * as vscode from 'vscode';
import { analyzeCurrentFile, lastAnalysisResult, onAnalysisComplete } from './commands/analyzeCurrentFile';
import { explainSelection } from './commands/explainSelection';
import { analyzeRepository } from './commands/analyzeRepository';
import { CodeXplainHoverProvider } from './providers/hoverProvider';
import { CodeXplainCodeLensProvider } from './providers/codeLensProvider';
import {
  createDiagnosticCollection,
  CodeXplainCodeActionProvider,
  registerDiagnosticCommands,
  updateDiagnosticsFromAnalysis,
  clearAllDiagnostics
} from './providers/diagnosticsProvider';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('CodeXplain extension is now active');

  // Create diagnostic collection
  const diagnosticCollection = createDiagnosticCollection();
  context.subscriptions.push(diagnosticCollection);

  // Register diagnostic commands (for quick fixes)
  registerDiagnosticCommands(context);

  // Register analyze command
  const analyzeCommand = vscode.commands.registerCommand('codexplain.analyzeCurrentFile', () =>
    analyzeCurrentFile(context)
  );

  // Register explain selection command
  const explainCommand = vscode.commands.registerCommand('codexplain.explainSelection', () =>
    explainSelection(context)
  );
  const analyzeRepoCommand = vscode.commands.registerCommand('codexplain.analyzeRepository', () =>
    analyzeRepository()
  );

  // Register copy results command
  const copyCommand = vscode.commands.registerCommand('codexplain.copyResults', async () => {
    if (!lastAnalysisResult) {
      vscode.window.showWarningMessage('No analysis results to copy. Run an analysis first.');
      return;
    }

    const markdown = formatResultsAsMarkdown(lastAnalysisResult);
    await vscode.env.clipboard.writeText(markdown);
    vscode.window.showInformationMessage('Analysis results copied to clipboard.');
  });

  // Supported languages for all providers
  const supportedLanguages = [
    'python',
    'javascript',
    'typescript',
    'typescriptreact',
    'javascriptreact',
    'java',
    'c',
    'cpp',
    'go',
    'rust'
  ];

  // Register hover provider
  const hoverProvider = new CodeXplainHoverProvider();
  const hoverRegistrations = supportedLanguages.map(lang =>
    vscode.languages.registerHoverProvider({ language: lang }, hoverProvider)
  );

  // Register CodeLens provider
  const codeLensProvider = new CodeXplainCodeLensProvider();
  const codeLensRegistrations = supportedLanguages.map(lang =>
    vscode.languages.registerCodeLensProvider({ language: lang }, codeLensProvider)
  );

  // Register Code Action provider (for quick fixes)
  const codeActionProvider = new CodeXplainCodeActionProvider();
  const codeActionRegistrations = supportedLanguages.map(lang =>
    vscode.languages.registerCodeActionsProvider(
      { language: lang },
      codeActionProvider,
      { providedCodeActionKinds: CodeXplainCodeActionProvider.providedCodeActionKinds }
    )
  );

  // Listen for analysis completion to update diagnostics
  onAnalysisComplete((result, document) => {
    updateDiagnosticsFromAnalysis(document, result);
  });

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'codexplain.analyzeCurrentFile';
  statusBarItem.text = '$(search) CodeXplain';
  statusBarItem.tooltip = 'Analyze current file with CodeXplain';

  // Show/hide based on settings and active editor
  const updateStatusBar = () => {
    const config = vscode.workspace.getConfiguration('codexplain');
    const showStatusBar = config.get<boolean>('showStatusBarItem', true);
    const editor = vscode.window.activeTextEditor;

    if (showStatusBar && editor && isSupportedLanguage(editor.document.languageId)) {
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  };

  // Listen for editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(updateStatusBar),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('codexplain.showStatusBarItem')) {
        updateStatusBar();
      }
    })
  );

  // Initial update
  updateStatusBar();

  context.subscriptions.push(
    analyzeCommand,
    explainCommand,
    analyzeRepoCommand,
    copyCommand,
    statusBarItem,
    ...hoverRegistrations,
    ...codeLensRegistrations,
    ...codeActionRegistrations
  );
}

export function deactivate() {
  clearAllDiagnostics();
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}

function isSupportedLanguage(languageId: string): boolean {
  const supported = [
    'python',
    'javascript',
    'typescript',
    'typescriptreact',
    'javascriptreact',
    'java',
    'c',
    'cpp',
    'go',
    'rust'
  ];
  return supported.includes(languageId);
}

interface AnalysisResult {
  filePath: string;
  language: string;
  summary: string;
  healthScore: {
    score: number;
    grade: string;
    summary: string;
    metrics: Record<string, number>;
    breakdown: Record<string, string>;
  };
}

function formatResultsAsMarkdown(result: AnalysisResult): string {
  const lines: string[] = [
    `# CodeXplain Analysis: ${result.filePath}`,
    '',
    `**Language:** ${result.language}`,
    `**Health Score:** ${result.healthScore.score.toFixed(1)}/100 (Grade ${result.healthScore.grade})`,
    '',
    '## Summary',
    '',
    result.healthScore.summary,
    '',
    '## AI Analysis',
    '',
    result.summary,
    '',
    '## Metrics Breakdown',
    '',
    '| Metric | Score | Notes |',
    '|--------|-------|-------|'
  ];

  for (const [metric, score] of Object.entries(result.healthScore.metrics)) {
    const notes = result.healthScore.breakdown[metric] || '';
    lines.push(`| ${metric} | ${score.toFixed(0)} | ${notes} |`);
  }

  return lines.join('\n');
}
