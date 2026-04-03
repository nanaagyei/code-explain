import fs from 'fs';
import { CodeXplainClient } from '../api/client';
import { getApiToken, getApiBaseUrl } from './auth';
import { formatError, writeOutput } from '../output/formatters';

export interface ChangelogOptions {
  output: 'markdown' | 'json';
  file?: string;
  out?: string;
  quiet: boolean;
}

function readStdinSync(): string {
  return fs.readFileSync(0, 'utf-8');
}

function readChangelog(options: ChangelogOptions): string {
  if (options.file) {
    if (options.file === '-') {
      return readStdinSync();
    }
    if (!fs.existsSync(options.file)) {
      throw new Error(`File not found: ${options.file}`);
    }
    return fs.readFileSync(options.file, 'utf-8');
  }
  if (!process.stdin.isTTY) {
    return readStdinSync();
  }
  throw new Error('Provide changelog via --file <path> or stdin (e.g. cat CHANGELOG.md | codexplain changelog <repoId>)');
}

export async function explainChangelog(repoId: string, options: ChangelogOptions): Promise<void> {
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

  let changelog: string;
  try {
    changelog = readChangelog(options);
  } catch (e) {
    console.error(formatError(e instanceof Error ? e.message : 'Failed to read changelog'));
    process.exit(1);
  }

  changelog = changelog.trim();
  if (!changelog) {
    console.error(formatError('Changelog is empty'));
    process.exit(1);
  }

  const client = new CodeXplainClient(baseUrl, token);

  try {
    if (!options.quiet) {
      process.stderr.write(`Explaining changelog for repository ${id}...\n`);
    }

    const result = await client.explainChangelog(id, changelog);

    if (options.output === 'json') {
      writeOutput(JSON.stringify(result, null, 2), options.out);
      if (!options.quiet && !options.out) {
        process.stderr.write(`\n(Tokens used: ${result.tokens_used})\n`);
      }
      return;
    }

    const text = `\n# Changelog explanation: ${result.repository}\n\n${result.explanation}`;
    writeOutput(text, options.out);
    if (!options.quiet && !options.out) {
      process.stderr.write(`\n(Tokens used: ${result.tokens_used})\n`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Changelog explanation failed';
    console.error(formatError(message));
    process.exit(1);
  }
}
