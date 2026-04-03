import { CodeXplainClient } from '../api/client';
import { getApiToken, getApiBaseUrl } from './auth';
import { formatError, writeOutput } from '../output/formatters';

export interface CompareReposOptions {
  output: 'markdown' | 'json';
  out?: string;
  quiet: boolean;
}

export async function compareRepositories(
  repoId1: string,
  repoId2: string,
  options: CompareReposOptions
): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = getApiToken();

  if (!token) {
    console.error(formatError('No API token configured. Run: codexplain config set-key <your-token>'));
    process.exit(1);
  }

  const id1 = parseInt(repoId1, 10);
  const id2 = parseInt(repoId2, 10);
  if (isNaN(id1) || isNaN(id2)) {
    console.error(formatError('Invalid repository IDs. Use numeric IDs.'));
    process.exit(1);
  }

  const client = new CodeXplainClient(baseUrl, token);

  try {
    if (!options.quiet) {
      process.stderr.write(`Comparing repositories ${id1} vs ${id2}...\n`);
    }

    const result = await client.compareRepositories(id1, id2);

    if (options.output === 'json') {
      writeOutput(JSON.stringify(result, null, 2), options.out);
      if (!options.quiet && !options.out) {
        process.stderr.write(`\n(Tokens used: ${result.tokens_used})\n`);
      }
      return;
    }

    const text = `\n# Compare: ${result.repo1.name} vs ${result.repo2.name}\n\n${result.comparison}`;
    writeOutput(text, options.out);
    if (!options.quiet && !options.out) {
      process.stderr.write(`\n(Tokens used: ${result.tokens_used})\n`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Repository comparison failed';
    console.error(formatError(message));
    process.exit(1);
  }
}
