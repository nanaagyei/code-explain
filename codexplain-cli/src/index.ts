#!/usr/bin/env node
import { Command } from 'commander';
import { analyzeGitHubRepo } from './commands/githubAnalyze';
import { analyzeLocalFile } from './commands/fileAnalyze';
import { listRepositories } from './commands/list';
import { checkStatus } from './commands/status';
import { openRepository } from './commands/open';
import { compareFiles } from './commands/compare';
import { explainChangelog } from './commands/changelog';
import { generatePrChecklist } from './commands/prChecklist';
import { compareRepositories } from './commands/compareRepos';
import { setApiKey, setApiUrl, showConfig } from './commands/auth';

const program = new Command();

program
  .name('codexplain')
  .description('CodeXplain CLI - Understand any codebase in minutes')
  .version('0.1.0');

// Config commands
const configCmd = program
  .command('config')
  .description('Manage CLI configuration');

configCmd
  .command('set-key <key>')
  .description('Set your CodeXplain API token')
  .action((key: string) => {
    setApiKey(key);
  });

configCmd
  .command('set-url <url>')
  .description('Set the CodeXplain API base URL')
  .action((url: string) => {
    setApiUrl(url);
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    showConfig();
  });

// GitHub analyze command
program
  .command('analyze <repoUrl>')
  .description('Analyze a GitHub repository')
  .option('-o, --output <format>', 'Output format: markdown | json', 'markdown')
  .option('-m, --max-files <count>', 'Maximum files to analyze (default: 100)', '100')
  .option('-w, --wait', 'Wait for analysis to complete (polls for status)', false)
  .option('-q, --quiet', 'Minimal output (just results, no progress)', false)
  .action(async (repoUrl: string, options: { output: string; maxFiles: string; wait: boolean; quiet: boolean }) => {
    const maxFiles = Number(options.maxFiles);
    await analyzeGitHubRepo(repoUrl, {
      output: options.output as 'markdown' | 'json',
      maxFiles: Number.isNaN(maxFiles) ? 100 : maxFiles,
      wait: options.wait,
      quiet: options.quiet
    });
  });

// Local file analyze command
program
  .command('file <path>')
  .description('Analyze a local code file')
  .option('-o, --output <format>', 'Output format: markdown | json', 'markdown')
  .option('-q, --quiet', 'Minimal output', false)
  .action(async (filePath: string, options: { output: string; quiet: boolean }) => {
    await analyzeLocalFile(filePath, {
      output: options.output as 'markdown' | 'json',
      quiet: options.quiet
    });
  });

// List repositories command
program
  .command('list')
  .description('List your analyzed repositories')
  .option('-o, --output <format>', 'Output format: table | json', 'table')
  .option('-l, --limit <count>', 'Limit number of results', '20')
  .action(async (options: { output: string; limit: string }) => {
    const limit = Number(options.limit);
    await listRepositories({
      output: options.output as 'table' | 'json',
      limit: Number.isNaN(limit) ? 20 : limit
    });
  });

// Status command
program
  .command('status <repoId>')
  .description('Check the status of a repository analysis')
  .option('-o, --output <format>', 'Output format: table | json', 'table')
  .option('-w, --watch', 'Watch for updates until complete', false)
  .action(async (repoId: string, options: { output: string; watch: boolean }) => {
    await checkStatus(repoId, {
      output: options.output as 'table' | 'json',
      watch: options.watch
    });
  });

// Open command
program
  .command('open <repoId>')
  .description('Open a repository in the web browser')
  .option('--url-only', 'Print URL without opening browser', false)
  .action(async (repoId: string, options: { urlOnly: boolean }) => {
    await openRepository(repoId, {
      urlOnly: options.urlOnly
    });
  });

// Compare command
program
  .command('compare <file1> <file2>')
  .description('Compare two local code files')
  .option('-o, --output <format>', 'Output format: markdown | json', 'markdown')
  .option('-q, --quiet', 'Minimal output', false)
  .action(async (file1: string, file2: string, options: { output: string; quiet: boolean }) => {
    await compareFiles(file1, file2, {
      output: options.output as 'markdown' | 'json',
      quiet: options.quiet
    });
  });

// Changelog explain command
program
  .command('changelog <repoId>')
  .description('Explain a changelog or commit history in plain language')
  .option('-f, --file <path>', 'Read changelog from file (use - for stdin)', undefined)
  .option('-o, --output <format>', 'Output format: markdown | json', 'markdown')
  .option('--out <path>', 'Write result to file instead of stdout', undefined)
  .option('-q, --quiet', 'Minimal output', false)
  .action(async (repoId: string, options: { file?: string; output: string; out?: string; quiet: boolean }) => {
    await explainChangelog(repoId, {
      output: options.output as 'markdown' | 'json',
      file: options.file,
      out: options.out,
      quiet: options.quiet
    });
  });

// PR checklist command
program
  .command('pr-checklist <repoId>')
  .description('Generate a pre-PR checklist for a repository')
  .option('-o, --output <format>', 'Output format: markdown | json', 'markdown')
  .option('--out <path>', 'Write result to file instead of stdout', undefined)
  .option('-q, --quiet', 'Minimal output', false)
  .action(async (repoId: string, options: { output: string; out?: string; quiet: boolean }) => {
    await generatePrChecklist(repoId, {
      output: options.output as 'markdown' | 'json',
      out: options.out,
      quiet: options.quiet
    });
  });

// Compare repositories command
program
  .command('compare-repos <repoId1> <repoId2>')
  .description('Compare two analyzed repositories')
  .option('-o, --output <format>', 'Output format: markdown | json', 'markdown')
  .option('--out <path>', 'Write result to file instead of stdout', undefined)
  .option('-q, --quiet', 'Minimal output', false)
  .action(async (repoId1: string, repoId2: string, options: { output: string; out?: string; quiet: boolean }) => {
    await compareRepositories(repoId1, repoId2, {
      output: options.output as 'markdown' | 'json',
      out: options.out,
      quiet: options.quiet
    });
  });

// Show help by default if no command provided
if (process.argv.length === 2) {
  program.help();
}

program.parse(process.argv);
