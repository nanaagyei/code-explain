import * as vscode from 'vscode';
import { CodeXplainClient } from '../api/client';
import { detectLanguageFromPath } from '../utils/language';

export interface ExplanationResult {
  explanation: string;
  selection: string;
  language: string;
}

export let lastExplanation: ExplanationResult | null = null;

export async function explainSelection(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('Open a file to explain code.');
    return;
  }

  const selection = editor.selection;
  if (selection.isEmpty) {
    vscode.window.showWarningMessage('Select some code to explain.');
    return;
  }

  const selectedText = editor.document.getText(selection);
  if (!selectedText.trim()) {
    vscode.window.showWarningMessage('Selection is empty.');
    return;
  }

  // Limit selection size
  if (selectedText.length > 10000) {
    vscode.window.showWarningMessage('Selection too large. Select a smaller code block (max 10,000 characters).');
    return;
  }

  const config = vscode.workspace.getConfiguration('codexplain');
  const apiBaseUrl = config.get<string>('apiBaseUrl');
  const apiToken = config.get<string>('apiToken');

  if (!apiBaseUrl || !apiToken) {
    const openSettings = 'Open Settings';
    const response = await vscode.window.showErrorMessage(
      'CodeXplain API not configured. Set apiBaseUrl and apiToken in settings.',
      openSettings
    );
    if (response === openSettings) {
      vscode.commands.executeCommand('workbench.action.openSettings', 'codexplain');
    }
    return;
  }

  const language = detectLanguageFromPath(editor.document.fileName);
  if (!language) {
    vscode.window.showWarningMessage('Unsupported file type for explanation.');
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'CodeXplain: Explaining selection...',
      cancellable: true
    },
    async (_progress, token) => {
      try {
        const client = new CodeXplainClient(apiBaseUrl, apiToken);

        const startLine = Math.max(0, selection.start.line - 10);
        const endLine = Math.min(editor.document.lineCount - 1, selection.end.line + 10);
        const contextRange = new vscode.Range(startLine, 0, endLine, editor.document.lineAt(endLine).text.length);
        const contextCode = editor.document.getText(contextRange);

        const explanation = await client.explainSelection(
          {
            code: selectedText,
            name: 'selection',
            context: contextCode,
            language
          },
          token
        );

        lastExplanation = {
          explanation,
          selection: selectedText,
          language
        };

        const doc = await vscode.workspace.openTextDocument({
          content: formatExplanation(lastExplanation),
          language: 'markdown'
        });

        await vscode.window.showTextDocument(doc, {
          viewColumn: vscode.ViewColumn.Beside,
          preview: true,
          preserveFocus: false
        });
      } catch (error: unknown) {
        if (token.isCancellationRequested) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Failed to explain selection';
        if (message.includes('cancelled')) {
          return;
        }
        vscode.window.showErrorMessage(message);
      }
    }
  );
}

function formatExplanation(result: ExplanationResult): string {
  return `# Code Explanation

## Selected Code

\`\`\`${result.language}
${result.selection}
\`\`\`

## Explanation

${result.explanation}
`;
}
