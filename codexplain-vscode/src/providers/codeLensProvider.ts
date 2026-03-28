import * as vscode from 'vscode';
import { detectLanguageFromPath } from '../utils/language';

interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  lineCount: number;
  complexity: 'Simple' | 'Moderate' | 'Complex';
  type: 'function' | 'class' | 'method';
}

// Cache to avoid re-parsing on every keystroke
const documentCache = new Map<string, { version: number; functions: FunctionInfo[] }>();

export class CodeXplainCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  private enabled: boolean = true;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Listen for config changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('codexplain.enableCodeLens')) {
        this.enabled = vscode.workspace.getConfiguration('codexplain').get<boolean>('enableCodeLens', true);
        this._onDidChangeCodeLenses.fire();
      }
    });

    // Debounced refresh on document change
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        // Invalidate cache for this document
        documentCache.delete(e.document.uri.toString());
        this._onDidChangeCodeLenses.fire();
      }, 500);
    });
  }

  provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
    if (!this.enabled) {
      return [];
    }

    const config = vscode.workspace.getConfiguration('codexplain');
    if (!config.get<boolean>('enableCodeLens', true)) {
      return [];
    }

    const language = detectLanguageFromPath(document.fileName);
    if (!language) {
      return [];
    }

    // Check cache
    const cacheKey = document.uri.toString();
    const cached = documentCache.get(cacheKey);
    if (cached && cached.version === document.version) {
      return this.createCodeLenses(cached.functions, document);
    }

    // Parse document
    const functions = this.parseFunctions(document, language);
    
    // Update cache
    documentCache.set(cacheKey, { version: document.version, functions });

    return this.createCodeLenses(functions, document);
  }

  private createCodeLenses(functions: FunctionInfo[], document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];

    for (const func of functions) {
      const range = new vscode.Range(func.startLine, 0, func.startLine, 0);

      // Complexity indicator
      const complexityIcon = func.complexity === 'Simple' ? '⚡' : func.complexity === 'Moderate' ? '⚠️' : '🔴';
      const complexityNote = func.complexity === 'Complex' ? ' - Consider refactoring' : '';

      // Main info lens
      const infoLens = new vscode.CodeLens(range, {
        title: `📏 ${func.lineCount} lines | ${complexityIcon} ${func.complexity}${complexityNote}`,
        command: 'codexplain.analyzeCurrentFile',
        tooltip: `${func.type}: ${func.name}\nLines: ${func.startLine + 1}-${func.endLine + 1}\nClick to analyze full file`
      });

      lenses.push(infoLens);
    }

    return lenses;
  }

  private parseFunctions(document: vscode.TextDocument, language: string): FunctionInfo[] {
    const text = document.getText();
    const lines = text.split('\n');
    const functions: FunctionInfo[] = [];

    // Language-specific patterns
    const patterns = this.getPatterns(language);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of patterns) {
        const match = line.match(pattern.regex);
        if (match) {
          const name = match[pattern.nameGroup] || 'anonymous';
          const startLine = i;
          const endLine = this.findEndLine(lines, i, language);
          const lineCount = endLine - startLine + 1;
          const complexity = this.calculateComplexity(lines, startLine, endLine);

          functions.push({
            name,
            startLine,
            endLine,
            lineCount,
            complexity,
            type: pattern.type
          });

          break; // Only match one pattern per line
        }
      }
    }

    return functions;
  }

  private getPatterns(language: string): Array<{ regex: RegExp; nameGroup: number; type: 'function' | 'class' | 'method' }> {
    switch (language) {
      case 'python':
        return [
          { regex: /^\s*def\s+(\w+)\s*\(/, nameGroup: 1, type: 'function' },
          { regex: /^\s*async\s+def\s+(\w+)\s*\(/, nameGroup: 1, type: 'function' },
          { regex: /^\s*class\s+(\w+)/, nameGroup: 1, type: 'class' }
        ];

      case 'javascript':
      case 'typescript':
        return [
          { regex: /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/, nameGroup: 1, type: 'function' },
          { regex: /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/, nameGroup: 1, type: 'function' },
          { regex: /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?function/, nameGroup: 1, type: 'function' },
          { regex: /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/, nameGroup: 1, type: 'method' },
          { regex: /^\s*(?:export\s+)?class\s+(\w+)/, nameGroup: 1, type: 'class' }
        ];

      case 'java':
        return [
          { regex: /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:\w+\s+)+(\w+)\s*\([^)]*\)\s*(?:throws\s+\w+)?\s*\{/, nameGroup: 1, type: 'method' },
          { regex: /^\s*(?:public|private|protected)?\s*(?:abstract\s+)?class\s+(\w+)/, nameGroup: 1, type: 'class' }
        ];

      case 'go':
        return [
          { regex: /^\s*func\s+(?:\([^)]+\)\s*)?(\w+)\s*\(/, nameGroup: 1, type: 'function' },
          { regex: /^\s*type\s+(\w+)\s+struct\s*\{/, nameGroup: 1, type: 'class' }
        ];

      case 'rust':
        return [
          { regex: /^\s*(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/, nameGroup: 1, type: 'function' },
          { regex: /^\s*(?:pub\s+)?struct\s+(\w+)/, nameGroup: 1, type: 'class' },
          { regex: /^\s*(?:pub\s+)?impl(?:<[^>]+>)?\s+(\w+)/, nameGroup: 1, type: 'class' }
        ];

      case 'c':
      case 'cpp':
        return [
          { regex: /^\s*(?:\w+\s+)+(\w+)\s*\([^)]*\)\s*\{/, nameGroup: 1, type: 'function' },
          { regex: /^\s*class\s+(\w+)/, nameGroup: 1, type: 'class' },
          { regex: /^\s*struct\s+(\w+)/, nameGroup: 1, type: 'class' }
        ];

      default:
        return [];
    }
  }

  private findEndLine(lines: string[], startLine: number, language: string): number {
    // For Python, use indentation
    if (language === 'python') {
      const startIndent = this.getIndentation(lines[startLine]);
      for (let i = startLine + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue; // Skip empty lines
        
        const indent = this.getIndentation(line);
        if (indent <= startIndent && line.trim() !== '') {
          return i - 1;
        }
      }
      return lines.length - 1;
    }

    // For brace-based languages
    let braceCount = 0;
    let foundOpenBrace = false;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundOpenBrace = true;
        } else if (char === '}') {
          braceCount--;
        }
      }

      if (foundOpenBrace && braceCount === 0) {
        return i;
      }
    }

    // Fallback: estimate based on common function sizes
    return Math.min(startLine + 50, lines.length - 1);
  }

  private getIndentation(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  private calculateComplexity(lines: string[], startLine: number, endLine: number): 'Simple' | 'Moderate' | 'Complex' {
    const functionLines = lines.slice(startLine, endLine + 1);
    const code = functionLines.join('\n');

    // Count complexity indicators
    const ifCount = (code.match(/\b(if|else\s+if|elif)\b/g) || []).length;
    const loopCount = (code.match(/\b(for|while|loop|foreach)\b/g) || []).length;
    const tryCount = (code.match(/\b(try|catch|except|finally)\b/g) || []).length;
    const switchCount = (code.match(/\b(switch|match|case)\b/g) || []).length;
    const returnCount = (code.match(/\breturn\b/g) || []).length;

    const lineCount = endLine - startLine + 1;
    const cyclomaticComplexity = 1 + ifCount + loopCount + switchCount;

    // Determine complexity
    if (lineCount > 50 || cyclomaticComplexity > 10) {
      return 'Complex';
    } else if (lineCount > 20 || cyclomaticComplexity > 5) {
      return 'Moderate';
    }
    return 'Simple';
  }
}

// Export function to clear cache (useful for testing)
export function clearCodeLensCache(): void {
  documentCache.clear();
}
