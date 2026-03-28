import { CodeXplainClient, RepositoryDetailResponse } from '../api/client';
import { getApiToken, getApiBaseUrl } from './auth';
import { formatMarkdown, formatJson, formatProgress, formatError } from '../output/formatters';

export interface AnalyzeOptions {
  output: 'markdown' | 'json';
  maxFiles: number;
  wait: boolean;
  quiet: boolean;
}

export async function analyzeGitHubRepo(repoUrl: string, options: AnalyzeOptions): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = getApiToken();

  if (!token) {
    console.error(formatError('No API token configured. Run: codexplain config set-key <your-token>'));
    process.exit(1);
  }

  const client = new CodeXplainClient(baseUrl, token);

  // Validate URL format
  if (!repoUrl.includes('github.com')) {
    console.error(formatError('Invalid GitHub URL. Please provide a full GitHub repository URL.'));
    console.error('Example: https://github.com/owner/repo');
    process.exit(1);
  }

  try {
    // Check API connectivity first
    if (!options.quiet) {
      process.stdout.write('Checking API connection... ');
    }
    const healthy = await client.healthCheck();
    if (!healthy) {
      console.error(formatError(`\nCannot connect to CodeXplain API at ${baseUrl}`));
      console.error('Check your API URL with: codexplain config show');
      process.exit(1);
    }
    if (!options.quiet) {
      console.log('OK');
    }

    // Submit analysis request
    if (!options.quiet) {
      console.log(`\nAnalyzing: ${repoUrl}`);
      console.log(`Max files: ${options.maxFiles}`);
      console.log('');
    }

    const repo = await client.createRepositoryFromGitHub(repoUrl, options.maxFiles);

    if (!options.quiet) {
      console.log(`Repository created: ${repo.name} (ID: ${repo.id})`);
      console.log(`Status: ${repo.status}`);
      console.log(`Files: ${repo.total_files}`);
    }

    // If not waiting, just show the submitted status
    if (!options.wait) {
      if (options.output === 'json') {
        console.log(formatJson({ submitted: true, repository: repo }));
      } else {
        console.log('\n' + formatProgress(repo.status, repo.processed_files, repo.total_files));
        console.log('\nAnalysis is processing in the background.');
        console.log('Run with --wait to wait for completion, or check status later.');
      }
      return;
    }

    // Wait for completion with progress updates
    if (!options.quiet) {
      console.log('\nWaiting for analysis to complete...');
    }

    const detail = await client.waitForCompletion(
      repo.id,
      (status, processed, total) => {
        if (!options.quiet) {
          process.stdout.clearLine?.(0);
          process.stdout.cursorTo?.(0);
          process.stdout.write(formatProgress(status, processed, total));
        }
      }
    );

    if (!options.quiet) {
      console.log('\n');
    }

    // Output full results
    const output = options.output === 'json'
      ? formatJson(detail)
      : formatMarkdown(detail);

    console.log(output);

  } catch (error: any) {
    const message = error?.message ?? 'Failed to analyze GitHub repo.';
    console.error(formatError(message));
    process.exit(1);
  }
}
