import { CodeXplainClient } from '../api/client';
import { getApiToken, getApiBaseUrl } from './auth';
import { formatError, formatCompact } from '../output/formatters';

export interface ListOptions {
  output: 'table' | 'json';
  limit: number;
}

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

export async function listRepositories(options: ListOptions): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = getApiToken();

  if (!token) {
    console.error(formatError('No API token configured. Run: codexplain config set-key <your-token>'));
    process.exit(1);
  }

  const client = new CodeXplainClient(baseUrl, token);

  try {
    const repos = await client.listRepositories();

    if (repos.length === 0) {
      console.log('No repositories found. Analyze one with: codexplain analyze <github-url>');
      return;
    }

    // Apply limit
    const limited = options.limit > 0 ? repos.slice(0, options.limit) : repos;

    if (options.output === 'json') {
      console.log(JSON.stringify(limited, null, 2));
      return;
    }

    // Table output
    console.log(`${colors.bold}Your Repositories${colors.reset} (${repos.length} total)`);
    console.log('');

    // Column headers
    const idWidth = 6;
    const nameWidth = 35;
    const statusWidth = 12;
    const filesWidth = 12;

    console.log(
      `${colors.dim}${'ID'.padEnd(idWidth)}${'NAME'.padEnd(nameWidth)}${'STATUS'.padEnd(statusWidth)}${'FILES'.padEnd(filesWidth)}${colors.reset}`
    );
    console.log(colors.dim + '-'.repeat(idWidth + nameWidth + statusWidth + filesWidth) + colors.reset);

    for (const repo of limited) {
      const statusColor = repo.status === 'completed' ? colors.green
        : repo.status === 'failed' ? colors.red
        : repo.status === 'processing' ? colors.yellow
        : colors.gray;

      const name = repo.name.length > nameWidth - 2
        ? repo.name.substring(0, nameWidth - 5) + '...'
        : repo.name;

      const filesStr = `${repo.processed_files}/${repo.total_files}`;

      console.log(
        `${String(repo.id).padEnd(idWidth)}` +
        `${name.padEnd(nameWidth)}` +
        `${statusColor}${repo.status.padEnd(statusWidth)}${colors.reset}` +
        `${filesStr.padEnd(filesWidth)}`
      );
    }

    if (repos.length > limited.length) {
      console.log('');
      console.log(`${colors.dim}Showing ${limited.length} of ${repos.length}. Use --limit to see more.${colors.reset}`);
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list repositories';
    console.error(formatError(message));
    process.exit(1);
  }
}
