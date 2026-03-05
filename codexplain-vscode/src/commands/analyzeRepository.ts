import * as vscode from 'vscode';
import { CodeXplainClient } from '../api/client';
import { detectLanguageFromPath } from '../utils/language';

const MAX_FILES_DEFAULT = 120;

export async function analyzeRepository() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders?.length) {
    vscode.window.showWarningMessage('Open a workspace folder to analyze the repository.');
    return;
  }

  const config = vscode.workspace.getConfiguration('codexplain');
  const apiBaseUrl = config.get<string>('apiBaseUrl');
  const apiToken = config.get<string>('apiToken');
  if (!apiBaseUrl) {
    vscode.window.showErrorMessage('CodeXplain API URL is not configured.');
    return;
  }

  const files = await vscode.workspace.findFiles('**/*.{py,js,jsx,ts,tsx,java,c,cpp,h,hpp,go,rs}', '**/{node_modules,dist,build,target,.git}/**');
  const selected = files.slice(0, MAX_FILES_DEFAULT);

  if (!selected.length) {
    vscode.window.showWarningMessage('No supported source files found in workspace.');
    return;
  }

  const client = new CodeXplainClient(apiBaseUrl, apiToken || undefined);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `CodeXplain: analyzing repository (${selected.length} files)`,
      cancellable: true,
    },
    async (_, token) => {
      const payloadFiles: Array<{ path: string; content: string; language?: string }> = [];
      for (const uri of selected) {
        if (token.isCancellationRequested) return;
        const bytes = await vscode.workspace.fs.readFile(uri);
        const content = new TextDecoder().decode(bytes);
        const path = vscode.workspace.asRelativePath(uri.fsPath);
        const language = detectLanguageFromPath(uri.fsPath) || undefined;
        payloadFiles.push({ path, content, language });
      }

      const result = await client.repositoryOverview(
        {
          repo_name: vscode.workspace.name ?? undefined,
          files: payloadFiles,
        },
        token
      );

      const doc = await vscode.workspace.openTextDocument({
        content:
          `# Repository Overview\n\n` +
          `**Repo:** ${result.repo_name}\n\n` +
          `**Files analyzed:** ${result.files_analyzed}\n\n` +
          `**Average complexity:** ${result.average_complexity}\n\n` +
          `## Summary\n\n${result.summary}\n\n` +
          `## Entry Points\n\n` +
          result.entry_points
            .map((e) => `- \`${e.path}\` (${e.language}) · complexity ${e.complexity}, fn ${e.functions}, cls ${e.classes}`)
            .join('\n'),
        language: 'markdown',
      });
      await vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.Beside });
      vscode.window.showInformationMessage(`Repository overview complete (${result.files_analyzed} files).`);
    }
  );
}
