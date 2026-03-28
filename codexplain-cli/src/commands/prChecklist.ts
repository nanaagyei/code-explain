import { CodeXplainClient } from '../api/client';
import { getApiToken, getApiBaseUrl } from './auth';
import { formatError, writeOutput } from '../output/formatters';

export interface PrChecklistOptions {
  output: 'markdown' | 'json';
  out?: string;
  quiet: boolean;
}

export async function generatePrChecklist(repoId: string, options: PrChecklistOptions): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = getApiToken();

  if (!token) {
    console.error(formatError('No API token configured. Run: codexplain config set-key <your-token>'));
    process.exit(1);
  }

  const id = parseInt(repoId, 10);
  if (isNaN(id)) {
    console.error(formatError(`Invalid repository ID: ${repoId}`));
    process.exit(1);
  }

  const client = new CodeXplainClient(baseUrl, token);

  try {
    if (!options.quiet) {
      process.stderr.write(`Generating PR checklist for repository ${id}...\n`);
    }

    const result = await client.getPrChecklist(id);

    if (options.output === 'json') {
      writeOutput(JSON.stringify(result, null, 2), options.out);
      if (!options.quiet && !options.out) {
        process.stderr.write(`\n(Tokens used: ${result.tokens_used})\n`);
      }
      return;
    }

    const text = `\n# Before you PR: ${result.repository}\n\n${result.checklist}`;
    writeOutput(text, options.out);
    if (!options.quiet && !options.out) {
      process.stderr.write(`\n(Tokens used: ${result.tokens_used})\n`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'PR checklist generation failed';
    console.error(formatError(message));
    process.exit(1);
  }
}
