import { CodeXplainClient, RepositoryDetailResponse } from '../api/client';
import { getApiToken, getApiBaseUrl } from './auth';
import { formatError, formatProgress, formatFileList } from '../output/formatters';

export interface StatusOptions {
  output: 'table' | 'json';
  watch: boolean;
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

export async function checkStatus(repoId: string, options: StatusOptions): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = getApiToken();

  if (!token) {
    console.error(formatError('No API token configured. Run: codexplain config set-key <your-token>'));
    process.exit(1);
  }

  // Parse repo ID
  const id = parseInt(repoId, 10);
  if (isNaN(id)) {
    console.error(formatError(`Invalid repository ID: ${repoId}`));
    process.exit(1);
  }

  const client = new CodeXplainClient(baseUrl, token);

  try {
    if (options.watch) {
      await watchStatus(client, id, options);
    } else {
      await showStatus(client, id, options);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get repository status';
    console.error(formatError(message));
    process.exit(1);
  }
}

async function showStatus(client: CodeXplainClient, repoId: number, options: StatusOptions): Promise<void> {
  const detail = await client.getRepository(repoId);

  if (options.output === 'json') {
    console.log(JSON.stringify(detail, null, 2));
    return;
  }

  printStatusTable(detail);
}

async function watchStatus(client: CodeXplainClient, repoId: number, options: StatusOptions): Promise<void> {
  console.log(`${colors.cyan}Watching repository ${repoId}...${colors.reset}`);
  console.log(`${colors.dim}Press Ctrl+C to stop${colors.reset}\n`);

  let lastProcessed = -1;

  while (true) {
    try {
      const detail = await client.getRepository(repoId);
      const repo = detail.repository;

      // Only update display if progress changed
      if (repo.processed_files !== lastProcessed) {
        // Clear previous lines (move cursor up and clear)
        if (lastProcessed !== -1) {
          process.stdout.write('\x1b[2K\x1b[1A\x1b[2K\x1b[1A\x1b[2K\r');
        }

        console.log(formatProgress(repo.status, repo.processed_files, repo.total_files));
        console.log(`${colors.dim}${repo.name}${colors.reset}`);

        lastProcessed = repo.processed_files;
      }

      // Check if done
      if (repo.status === 'completed' || repo.status === 'failed') {
        console.log('');
        if (options.output === 'json') {
          console.log(JSON.stringify(detail, null, 2));
        } else {
          printStatusTable(detail);
        }
        break;
      }

      // Wait before next poll
      await sleep(2000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error polling status';
      console.error(formatError(message));
      break;
    }
  }
}

function printStatusTable(detail: RepositoryDetailResponse): void {
  const repo = detail.repository;
  const files = detail.files || [];

  // Header
  console.log(`\n${colors.bold}Repository Status${colors.reset}`);
  console.log('─'.repeat(50));

  // Basic info
  console.log(`${colors.cyan}Name:${colors.reset}     ${repo.name}`);
  console.log(`${colors.cyan}ID:${colors.reset}       ${repo.id}`);
  
  if (repo.url) {
    console.log(`${colors.cyan}URL:${colors.reset}      ${repo.url}`);
  }

  // Status with color
  const statusColor = repo.status === 'completed' ? colors.green
    : repo.status === 'failed' ? colors.red
    : repo.status === 'processing' ? colors.yellow
    : colors.gray;
  console.log(`${colors.cyan}Status:${colors.reset}   ${statusColor}${repo.status}${colors.reset}`);

  // Progress
  const percentage = repo.total_files > 0
    ? Math.round((repo.processed_files / repo.total_files) * 100)
    : 0;
  console.log(`${colors.cyan}Progress:${colors.reset} ${repo.processed_files}/${repo.total_files} files (${percentage}%)`);

  // Timestamps
  if (repo.created_at) {
    console.log(`${colors.cyan}Created:${colors.reset}  ${formatDate(repo.created_at)}`);
  }
  if (repo.updated_at) {
    console.log(`${colors.cyan}Updated:${colors.reset}  ${formatDate(repo.updated_at)}`);
  }

  // Files summary
  if (files.length > 0) {
    console.log(`\n${colors.bold}Files${colors.reset}`);
    console.log('─'.repeat(50));

    const completed = files.filter(f => f.status === 'completed').length;
    const processing = files.filter(f => f.status === 'processing').length;
    const pending = files.filter(f => f.status === 'pending').length;
    const failed = files.filter(f => f.status === 'failed').length;

    console.log(`${colors.green}✓ Completed:${colors.reset}  ${completed}`);
    if (processing > 0) {
      console.log(`${colors.yellow}○ Processing:${colors.reset} ${processing}`);
    }
    if (pending > 0) {
      console.log(`${colors.gray}○ Pending:${colors.reset}    ${pending}`);
    }
    if (failed > 0) {
      console.log(`${colors.red}✗ Failed:${colors.reset}     ${failed}`);
    }

    // Show first few files
    if (files.length > 0) {
      console.log(`\n${colors.dim}Recent files:${colors.reset}`);
      const recentFiles = files.slice(0, 5);
      for (const file of recentFiles) {
        const icon = file.status === 'completed' ? `${colors.green}✓${colors.reset}`
          : file.status === 'failed' ? `${colors.red}✗${colors.reset}`
          : file.status === 'processing' ? `${colors.yellow}○${colors.reset}`
          : `${colors.gray}○${colors.reset}`;
        console.log(`  ${icon} ${file.file_path} ${colors.dim}(${file.language})${colors.reset}`);
      }
      if (files.length > 5) {
        console.log(`  ${colors.dim}... and ${files.length - 5} more${colors.reset}`);
      }
    }
  }

  // Start Here summary if available
  if (detail.start_here?.project_summary) {
    console.log(`\n${colors.bold}Start Here${colors.reset}`);
    console.log('─'.repeat(50));
    console.log(detail.start_here.project_summary.substring(0, 200) + '...');
  }

  console.log('');
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString();
  } catch {
    return dateStr;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
