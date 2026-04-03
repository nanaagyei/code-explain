import * as vscode from 'vscode';
import { CodeXplainClient, QuickFileAnalysisResponse } from '../api/client';
import { ResultsPanel } from '../panels/ResultsPanel';
import { detectLanguageFromPath } from '../utils/language';

export interface AnalysisResult {
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

/** Stores the last successful analysis result for copy-to-clipboard functionality */
export let lastAnalysisResult: AnalysisResult | null = null;

/** Callbacks for when analysis completes (used by diagnostics provider) */
type AnalysisCompleteCallback = (result: AnalysisResult, document: vscode.TextDocument) => void;
const analysisCompleteCallbacks: AnalysisCompleteCallback[] = [];

/** Register a callback to be called when analysis completes */
export function onAnalysisComplete(callback: AnalysisCompleteCallback): void {
  analysisCompleteCallbacks.push(callback);
}

/** Notify all registered callbacks */
function notifyAnalysisComplete(result: AnalysisResult, document: vscode.TextDocument): void {
  for (const callback of analysisCompleteCallbacks) {
    try {
      callback(result, document);
    } catch (e) {
      console.error('Error in analysis complete callback:', e);
    }
  }
}

export async function analyzeCurrentFile(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('Open a file to analyze.');
    return;
  }

  const document = editor.document;
  if (document.isUntitled) {
    vscode.window.showWarningMessage('Save the file before analyzing.');
    return;
  }

  const code = document.getText();
  if (!code.trim()) {
    vscode.window.showWarningMessage('Current file is empty.');
    return;
  }

  const config = vscode.workspace.getConfiguration('codexplain');
  const apiBaseUrl = config.get<string>('apiBaseUrl');
  const apiToken = config.get<string>('apiToken');

  if (!apiBaseUrl) {
    const openSettings = 'Open Settings';
    const response = await vscode.window.showErrorMessage(
      'CodeXplain API URL not configured. Set codexplain.apiBaseUrl in settings.',
      openSettings
    );
    if (response === openSettings) {
      vscode.commands.executeCommand('workbench.action.openSettings', 'codexplain');
    }
    return;
  }

  const language = detectLanguageFromPath(document.fileName);
  if (!language) {
    vscode.window.showWarningMessage(
      `Unsupported file type for analysis. Supported: Python, JavaScript, TypeScript, Java, C, C++, Go, Rust`
    );
    return;
  }

  const filePath = vscode.workspace.asRelativePath(document.uri.fsPath);
  const repoName = vscode.workspace.name ?? undefined;

  const client = new CodeXplainClient(apiBaseUrl, apiToken || undefined);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'CodeXplain: analyzing file...',
      cancellable: true
    },
    async (progress, token) => {
      try {
        progress.report({ message: 'Sending to API...' });

        const result = await client.quickFileAnalysis(
          {
            code,
            language,
            file_path: filePath,
            repo_name: repoName
          },
          token
        );

        // Store result for copy-to-clipboard
        lastAnalysisResult = {
          filePath,
          language,
          summary: result.summary,
          healthScore: result.health_score
        };

        progress.report({ message: 'Rendering results...' });

        ResultsPanel.render(context.extensionUri, lastAnalysisResult);

        // Notify callbacks (for diagnostics, etc.)
        notifyAnalysisComplete(lastAnalysisResult, document);

        // Show success notification with action buttons
        const copyAction = 'Copy Results';
        const response = await vscode.window.showInformationMessage(
          `Analysis complete! Health Score: ${result.health_score.grade} (${result.health_score.score.toFixed(0)}/100)`,
          copyAction
        );

        if (response === copyAction) {
          vscode.commands.executeCommand('codexplain.copyResults');
        }
      } catch (error: any) {
        if (token.isCancellationRequested) {
          return;
        }

        const message = error?.message ?? 'Failed to analyze file.';

        // Offer retry on failure
        const retryAction = 'Retry';
        const settingsAction = 'Check Settings';
        const response = await vscode.window.showErrorMessage(message, retryAction, settingsAction);

        if (response === retryAction) {
          vscode.commands.executeCommand('codexplain.analyzeCurrentFile');
        } else if (response === settingsAction) {
          vscode.commands.executeCommand('workbench.action.openSettings', 'codexplain');
        }
      }
    }
  );
}
