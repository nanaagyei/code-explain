import fs from 'fs';
import {
  RepositoryResponse,
  RepositoryDetailResponse,
  CodeFileResponse,
  StartHereSummary
} from '../api/client';

/** Write result to stdout or to file when --out is set. */
export function writeOutput(content: string, outPath?: string): void {
  if (outPath) {
    fs.writeFileSync(outPath, content, 'utf-8');
  } else {
    console.log(content);
  }
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

export function formatError(message: string): string {
  return `${colors.red}Error:${colors.reset} ${message}`;
}

export function formatProgress(status: string, processed: number, total: number): string {
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
  const barWidth = 30;
  const filled = Math.round((percentage / 100) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

  const statusColor = status === 'completed' ? colors.green
    : status === 'failed' ? colors.red
    : colors.yellow;

  return `${statusColor}${status}${colors.reset} [${bar}] ${processed}/${total} files (${percentage}%)`;
}

export function formatMarkdown(result: RepositoryDetailResponse | { submitted: boolean; repository: RepositoryResponse }): string {
  // Handle submitted-only response
  if ('submitted' in result) {
    return formatSubmittedMarkdown(result.repository);
  }

  const { repository, files, start_here } = result;
  const lines: string[] = [];

  // Header
  lines.push(`# ${repository.name}`);
  lines.push('');
  lines.push(`**Status:** ${repository.status}`);
  lines.push(`**Files:** ${repository.processed_files}/${repository.total_files}`);
  if (repository.url) {
    lines.push(`**Source:** ${repository.url}`);
  }
  lines.push('');

  // Start Here section
  if (start_here) {
    lines.push('---');
    lines.push('');
    lines.push('## Start Here');
    lines.push('');

    if (start_here.project_summary) {
      lines.push('### What is this project?');
      lines.push('');
      lines.push(start_here.project_summary);
      lines.push('');
    }

    if (start_here.problem_solved) {
      lines.push('### What problem does it solve?');
      lines.push('');
      lines.push(start_here.problem_solved);
      lines.push('');
    }

    if (start_here.structure_overview) {
      lines.push('### How is it structured?');
      lines.push('');
      lines.push(start_here.structure_overview);
      lines.push('');
    }

    if (start_here.entry_points && start_here.entry_points.length > 0) {
      lines.push('### Where should I start reading?');
      lines.push('');
      start_here.entry_points.forEach(ep => {
        lines.push(`- \`${ep}\``);
      });
      lines.push('');
    }

    if (start_here.contributor_quickstart) {
      lines.push('### Contributor Quick Start');
      lines.push('');
      lines.push(start_here.contributor_quickstart);
      lines.push('');
    }
  }

  // Files section
  if (files && files.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Files');
    lines.push('');

    const completed = files.filter(f => f.status === 'completed');
    const failed = files.filter(f => f.status === 'failed');

    if (completed.length > 0) {
      lines.push(`### Analyzed (${completed.length})`);
      lines.push('');
      lines.push('| File | Language | Complexity |');
      lines.push('|------|----------|------------|');

      for (const file of completed) {
        const complexity = file.documentation?.complexity || file.complexity_score || '-';
        lines.push(`| \`${file.file_path}\` | ${file.language} | ${complexity} |`);
      }
      lines.push('');

      // File summaries
      lines.push('### File Summaries');
      lines.push('');
      for (const file of completed) {
        if (file.documentation?.summary) {
          lines.push(`#### ${file.file_path}`);
          lines.push('');
          lines.push(file.documentation.summary);
          lines.push('');
        }
      }
    }

    if (failed.length > 0) {
      lines.push(`### Failed (${failed.length})`);
      lines.push('');
      failed.forEach(f => {
        lines.push(`- \`${f.file_path}\``);
      });
      lines.push('');
    }
  }

  return lines.join('\n');
}

function formatSubmittedMarkdown(repo: RepositoryResponse): string {
  return [
    `# Analysis Submitted`,
    '',
    `**Repository:** ${repo.name}`,
    `**ID:** ${repo.id}`,
    `**Status:** ${repo.status}`,
    `**Files:** ${repo.total_files}`,
    '',
    'Analysis is processing in the background.',
    'Run with `--wait` to wait for completion.'
  ].join('\n');
}

export function formatJson(result: RepositoryDetailResponse | { submitted: boolean; repository: RepositoryResponse }): string {
  return JSON.stringify(result, null, 2);
}

export function formatCompact(repo: RepositoryResponse): string {
  return [
    `${colors.bold}${repo.name}${colors.reset}`,
    `  Status: ${repo.status}`,
    `  Files: ${repo.processed_files}/${repo.total_files}`
  ].join('\n');
}

export function formatFileList(files: CodeFileResponse[]): string {
  const lines: string[] = [];

  for (const file of files) {
    const statusIcon = file.status === 'completed' ? `${colors.green}✓${colors.reset}`
      : file.status === 'failed' ? `${colors.red}✗${colors.reset}`
      : `${colors.yellow}○${colors.reset}`;

    lines.push(`${statusIcon} ${file.file_path} (${file.language})`);
  }

  return lines.join('\n');
}
