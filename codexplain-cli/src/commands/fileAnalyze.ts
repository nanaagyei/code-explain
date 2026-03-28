import fs from 'fs';
import path from 'path';
import { getApiToken, getApiBaseUrl } from './auth';
import { formatError } from '../output/formatters';

// Supported language extensions
const languageMap: Record<string, string> = {
  '.py': 'python',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.java': 'java',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.hpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.go': 'go',
  '.rs': 'rust'
};

export interface FileAnalyzeOptions {
  output: 'markdown' | 'json';
  quiet: boolean;
}

interface QuickFileAnalysisResponse {
  summary: string;
  health_score: {
    score: number;
    grade: string;
    summary: string;
    metrics: Record<string, number>;
    breakdown: Record<string, string>;
  };
  tokens_used: number;
}

function detectLanguage(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  return languageMap[ext] || null;
}

export async function analyzeLocalFile(filePath: string, options: FileAnalyzeOptions): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = getApiToken();

  if (!token) {
    console.error(formatError('No API token configured. Run: codexplain config set-key <your-token>'));
    process.exit(1);
  }

  // Resolve and validate file path
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(formatError(`File not found: ${resolvedPath}`));
    process.exit(1);
  }

  const stats = fs.statSync(resolvedPath);
  if (!stats.isFile()) {
    console.error(formatError(`Not a file: ${resolvedPath}`));
    process.exit(1);
  }

  // Detect language
  const language = detectLanguage(resolvedPath);
  if (!language) {
    console.error(formatError(`Unsupported file type: ${path.extname(resolvedPath)}`));
    console.error('Supported: .py, .js, .jsx, .ts, .tsx, .java, .c, .h, .cpp, .hpp, .go, .rs');
    process.exit(1);
  }

  // Read file content
  const code = fs.readFileSync(resolvedPath, 'utf-8');
  if (!code.trim()) {
    console.error(formatError('File is empty'));
    process.exit(1);
  }

  // Check file size (warn if large)
  const fileSizeKB = stats.size / 1024;
  if (fileSizeKB > 100 && !options.quiet) {
    console.log(`Warning: Large file (${fileSizeKB.toFixed(1)} KB) may take longer to analyze.`);
  }

  if (!options.quiet) {
    console.log(`Analyzing: ${resolvedPath}`);
    console.log(`Language: ${language}`);
    console.log('');
  }

  try {
    const response = await fetch(`${baseUrl}/code-analysis/quick-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code,
        language,
        file_path: path.basename(resolvedPath),
        repo_name: path.basename(path.dirname(resolvedPath))
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { detail?: string };
      const message = errorData.detail || `HTTP ${response.status}`;
      throw new Error(message);
    }

    const result = (await response.json()) as QuickFileAnalysisResponse;

    if (options.output === 'json') {
      console.log(JSON.stringify({
        file_path: resolvedPath,
        language,
        ...result
      }, null, 2));
    } else {
      console.log(formatFileAnalysisMarkdown(resolvedPath, language, result));
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to analyze file';
    console.error(formatError(message));
    process.exit(1);
  }
}

function formatFileAnalysisMarkdown(
  filePath: string,
  language: string,
  result: QuickFileAnalysisResponse
): string {
  const hs = result.health_score;
  const lines: string[] = [
    `# File Analysis: ${path.basename(filePath)}`,
    '',
    `**Path:** ${filePath}`,
    `**Language:** ${language}`,
    `**Health Score:** ${hs.score.toFixed(0)}/100 (Grade ${hs.grade})`,
    '',
    '---',
    '',
    '## Health Summary',
    '',
    hs.summary,
    '',
    '## AI Analysis',
    '',
    result.summary,
    '',
    '## Metrics Breakdown',
    '',
    '| Metric | Score | Notes |',
    '|--------|-------|-------|'
  ];

  for (const [metric, score] of Object.entries(hs.metrics)) {
    const notes = hs.breakdown[metric] || '';
    const metricName = metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    lines.push(`| ${metricName} | ${score.toFixed(0)} | ${notes} |`);
  }

  lines.push('');
  lines.push(`*Tokens used: ${result.tokens_used}*`);

  return lines.join('\n');
}
