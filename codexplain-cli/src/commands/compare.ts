import fs from 'fs';
import path from 'path';
import { getApiToken, getApiBaseUrl } from './auth';
import { formatError } from '../output/formatters';

export interface CompareOptions {
  output: 'markdown' | 'json';
  quiet: boolean;
}

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

interface FileAnalysis {
  filePath: string;
  fileName: string;
  language: string;
  lineCount: number;
  functionCount: number;
  classCount: number;
  analysis: QuickFileAnalysisResponse;
}

interface ComparisonResult {
  file1: FileAnalysis;
  file2: FileAnalysis;
  differences: string[];
}

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

export async function compareFiles(file1Path: string, file2Path: string, options: CompareOptions): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const token = getApiToken();

  if (!token) {
    console.error(formatError('No API token configured. Run: codexplain config set-key <your-token>'));
    process.exit(1);
  }

  // Validate both files
  const file1 = validateFile(file1Path);
  const file2 = validateFile(file2Path);

  if (!options.quiet) {
    console.log(`Comparing files...`);
    console.log(`  File 1: ${file1.path}`);
    console.log(`  File 2: ${file2.path}`);
    console.log('');
  }

  try {
    // Analyze both files in parallel
    if (!options.quiet) {
      console.log('Analyzing files...');
    }

    const [analysis1, analysis2] = await Promise.all([
      analyzeFile(baseUrl, token, file1),
      analyzeFile(baseUrl, token, file2)
    ]);

    // Generate comparison
    const comparison: ComparisonResult = {
      file1: analysis1,
      file2: analysis2,
      differences: generateDifferences(analysis1, analysis2)
    };

    // Output
    if (options.output === 'json') {
      console.log(JSON.stringify(comparison, null, 2));
    } else {
      console.log(formatComparisonMarkdown(comparison));
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to compare files';
    console.error(formatError(message));
    process.exit(1);
  }
}

interface ValidatedFile {
  path: string;
  name: string;
  language: string;
  content: string;
  lineCount: number;
}

function validateFile(filePath: string): ValidatedFile {
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

  const ext = path.extname(resolvedPath).toLowerCase();
  const language = languageMap[ext];
  if (!language) {
    console.error(formatError(`Unsupported file type: ${ext}`));
    console.error('Supported: .py, .js, .jsx, .ts, .tsx, .java, .c, .h, .cpp, .hpp, .go, .rs');
    process.exit(1);
  }

  const content = fs.readFileSync(resolvedPath, 'utf-8');
  if (!content.trim()) {
    console.error(formatError(`File is empty: ${resolvedPath}`));
    process.exit(1);
  }

  return {
    path: resolvedPath,
    name: path.basename(resolvedPath),
    language,
    content,
    lineCount: content.split('\n').length
  };
}

async function analyzeFile(baseUrl: string, token: string, file: ValidatedFile): Promise<FileAnalysis> {
  const response = await fetch(`${baseUrl}/code-analysis/quick-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      code: file.content,
      language: file.language,
      file_path: file.name,
      repo_name: path.basename(path.dirname(file.path))
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { detail?: string };
    const message = errorData.detail || `HTTP ${response.status}`;
    throw new Error(`Failed to analyze ${file.name}: ${message}`);
  }

  const analysis = (await response.json()) as QuickFileAnalysisResponse;

  // Count functions and classes
  const { functionCount, classCount } = countStructures(file.content, file.language);

  return {
    filePath: file.path,
    fileName: file.name,
    language: file.language,
    lineCount: file.lineCount,
    functionCount,
    classCount,
    analysis
  };
}

function countStructures(code: string, language: string): { functionCount: number; classCount: number } {
  let functionCount = 0;
  let classCount = 0;

  const lines = code.split('\n');

  for (const line of lines) {
    // Count functions
    switch (language) {
      case 'python':
        if (/^\s*def\s+\w+\s*\(/.test(line) || /^\s*async\s+def\s+\w+\s*\(/.test(line)) {
          functionCount++;
        }
        if (/^\s*class\s+\w+/.test(line)) {
          classCount++;
        }
        break;

      case 'javascript':
      case 'typescript':
        if (/^\s*(?:export\s+)?(?:async\s+)?function\s+\w+\s*\(/.test(line)) {
          functionCount++;
        }
        if (/^\s*(?:export\s+)?(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\(/.test(line)) {
          functionCount++;
        }
        if (/^\s*(?:export\s+)?class\s+\w+/.test(line)) {
          classCount++;
        }
        break;

      case 'java':
        if (/^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:\w+\s+)+\w+\s*\([^)]*\)\s*(?:throws\s+\w+)?\s*\{/.test(line)) {
          functionCount++;
        }
        if (/^\s*(?:public|private|protected)?\s*(?:abstract\s+)?class\s+\w+/.test(line)) {
          classCount++;
        }
        break;

      case 'go':
        if (/^\s*func\s+/.test(line)) {
          functionCount++;
        }
        if (/^\s*type\s+\w+\s+struct\s*\{/.test(line)) {
          classCount++;
        }
        break;

      case 'rust':
        if (/^\s*(?:pub\s+)?(?:async\s+)?fn\s+\w+/.test(line)) {
          functionCount++;
        }
        if (/^\s*(?:pub\s+)?struct\s+\w+/.test(line) || /^\s*(?:pub\s+)?impl\s+/.test(line)) {
          classCount++;
        }
        break;

      case 'c':
      case 'cpp':
        if (/^\s*(?:\w+\s+)+\w+\s*\([^)]*\)\s*\{/.test(line)) {
          functionCount++;
        }
        if (/^\s*class\s+\w+/.test(line) || /^\s*struct\s+\w+/.test(line)) {
          classCount++;
        }
        break;
    }
  }

  return { functionCount, classCount };
}

function generateDifferences(file1: FileAnalysis, file2: FileAnalysis): string[] {
  const differences: string[] = [];
  const hs1 = file1.analysis.health_score;
  const hs2 = file2.analysis.health_score;

  // Overall score comparison
  const scoreDiff = hs1.score - hs2.score;
  if (Math.abs(scoreDiff) > 10) {
    if (scoreDiff > 0) {
      differences.push(`${file1.fileName} has a significantly higher health score (+${scoreDiff.toFixed(0)} points)`);
    } else {
      differences.push(`${file2.fileName} has a significantly higher health score (+${Math.abs(scoreDiff).toFixed(0)} points)`);
    }
  }

  // Size comparison
  const lineDiff = file1.lineCount - file2.lineCount;
  if (Math.abs(lineDiff) > 20) {
    if (lineDiff > 0) {
      differences.push(`${file1.fileName} is larger (${lineDiff} more lines)`);
    } else {
      differences.push(`${file2.fileName} is larger (${Math.abs(lineDiff)} more lines)`);
    }
  }

  // Function count comparison
  const funcDiff = file1.functionCount - file2.functionCount;
  if (Math.abs(funcDiff) > 2) {
    if (funcDiff > 0) {
      differences.push(`${file1.fileName} has more functions (${funcDiff} more)`);
    } else {
      differences.push(`${file2.fileName} has more functions (${Math.abs(funcDiff)} more)`);
    }
  }

  // Metric-by-metric comparison
  const metrics1 = hs1.metrics;
  const metrics2 = hs2.metrics;
  
  for (const metric of Object.keys(metrics1)) {
    if (metrics2[metric] !== undefined) {
      const diff = metrics1[metric] - metrics2[metric];
      if (Math.abs(diff) > 15) {
        const metricName = metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        if (diff > 0) {
          differences.push(`${file1.fileName} scores higher in ${metricName} (+${diff.toFixed(0)})`);
        } else {
          differences.push(`${file2.fileName} scores higher in ${metricName} (+${Math.abs(diff).toFixed(0)})`);
        }
      }
    }
  }

  // If no significant differences found
  if (differences.length === 0) {
    differences.push('Both files have similar quality characteristics');
  }

  return differences;
}

function formatComparisonMarkdown(comparison: ComparisonResult): string {
  const { file1, file2, differences } = comparison;
  const hs1 = file1.analysis.health_score;
  const hs2 = file2.analysis.health_score;

  const lines: string[] = [
    '# File Comparison',
    '',
    '## Overview',
    '',
    '| Aspect | ' + file1.fileName + ' | ' + file2.fileName + ' |',
    '|--------|' + '-'.repeat(file1.fileName.length + 2) + '|' + '-'.repeat(file2.fileName.length + 2) + '|',
    `| Health Score | ${hs1.score.toFixed(0)} (${hs1.grade}) | ${hs2.score.toFixed(0)} (${hs2.grade}) |`,
    `| Lines | ${file1.lineCount} | ${file2.lineCount} |`,
    `| Functions | ${file1.functionCount} | ${file2.functionCount} |`,
    `| Classes/Structs | ${file1.classCount} | ${file2.classCount} |`,
    `| Language | ${file1.language} | ${file2.language} |`,
    '',
    '## Health Metrics Comparison',
    '',
    '| Metric | ' + file1.fileName + ' | ' + file2.fileName + ' | Difference |',
    '|--------|' + '-'.repeat(file1.fileName.length + 2) + '|' + '-'.repeat(file2.fileName.length + 2) + '|------------|'
  ];

  // Metrics table
  const allMetrics = new Set([...Object.keys(hs1.metrics), ...Object.keys(hs2.metrics)]);
  for (const metric of allMetrics) {
    const score1 = hs1.metrics[metric] ?? '-';
    const score2 = hs2.metrics[metric] ?? '-';
    const metricName = metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    let diff = '-';
    if (typeof score1 === 'number' && typeof score2 === 'number') {
      const d = score1 - score2;
      diff = d > 0 ? `+${d.toFixed(0)}` : d.toFixed(0);
    }

    const s1 = typeof score1 === 'number' ? score1.toFixed(0) : score1;
    const s2 = typeof score2 === 'number' ? score2.toFixed(0) : score2;
    
    lines.push(`| ${metricName} | ${s1} | ${s2} | ${diff} |`);
  }

  // Health summaries
  lines.push('');
  lines.push('## Health Summaries');
  lines.push('');
  lines.push(`### ${file1.fileName}`);
  lines.push('');
  lines.push(hs1.summary);
  lines.push('');
  lines.push(`### ${file2.fileName}`);
  lines.push('');
  lines.push(hs2.summary);

  // AI Summaries
  lines.push('');
  lines.push('## Code Summaries');
  lines.push('');
  lines.push(`### ${file1.fileName}`);
  lines.push('');
  lines.push(file1.analysis.summary);
  lines.push('');
  lines.push(`### ${file2.fileName}`);
  lines.push('');
  lines.push(file2.analysis.summary);

  // Key differences
  lines.push('');
  lines.push('## Key Differences');
  lines.push('');
  for (const diff of differences) {
    lines.push(`- ${diff}`);
  }

  // Tokens used
  lines.push('');
  lines.push('---');
  lines.push(`*Total tokens used: ${file1.analysis.tokens_used + file2.analysis.tokens_used}*`);

  return lines.join('\n');
}
