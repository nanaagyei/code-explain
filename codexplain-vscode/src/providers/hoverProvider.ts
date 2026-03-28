import * as vscode from 'vscode';
import { detectLanguageFromPath } from '../utils/language';

// Simple cache to avoid repeated API calls
const hoverCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class CodeXplainHoverProvider implements vscode.HoverProvider {
  private enabled: boolean = true;

  constructor() {
    // Listen for config changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('codexplain.enableHoverHints')) {
        this.enabled = vscode.workspace.getConfiguration('codexplain').get<boolean>('enableHoverHints', true);
      }
    });
  }

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    if (!this.enabled) {
      return null;
    }

    const config = vscode.workspace.getConfiguration('codexplain');
    const enableHover = config.get<boolean>('enableHoverHints', true);
    if (!enableHover) {
      return null;
    }

    const language = detectLanguageFromPath(document.fileName);
    if (!language) {
      return null;
    }

    // Get the word/symbol at position
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);
    if (!word || word.length < 2) {
      return null;
    }

    // Check if it looks like a function/method call or definition
    const line = document.lineAt(position.line).text;
    const isFunctionLike = this.isFunctionContext(line, word, position.character);
    
    if (!isFunctionLike) {
      return null;
    }

    // Check cache
    const cacheKey = `${document.uri.fsPath}:${word}`;
    const cached = hoverCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new vscode.Hover(new vscode.MarkdownString(cached.content));
    }

    // Get context around the symbol
    const startLine = Math.max(0, position.line - 5);
    const endLine = Math.min(document.lineCount - 1, position.line + 15);
    const contextRange = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
    const contextCode = document.getText(contextRange);

    // Find the function definition in context
    const functionContext = this.extractFunctionContext(contextCode, word, language);
    if (!functionContext) {
      return null;
    }

    // Create a quick hover with local analysis (no API call for speed)
    const hoverContent = this.generateQuickHover(word, functionContext, language);

    // Cache it
    hoverCache.set(cacheKey, { content: hoverContent, timestamp: Date.now() });

    const markdown = new vscode.MarkdownString(hoverContent);
    markdown.supportHtml = true;
    markdown.isTrusted = true;

    return new vscode.Hover(markdown, wordRange);
  }

  private isFunctionContext(line: string, word: string, charPos: number): boolean {
    // Check if word is followed by ( - likely a function call
    const afterWord = line.substring(charPos + word.length).trim();
    if (afterWord.startsWith('(')) {
      return true;
    }

    // Check for function definitions
    const patterns = [
      /\bdef\s+\w+\s*\(/,           // Python
      /\bfunction\s+\w+\s*\(/,       // JavaScript
      /\bfunc\s+\w+\s*\(/,           // Go
      /\bfn\s+\w+\s*\(/,             // Rust
      /\b(public|private|protected)?\s*(static\s+)?\w+\s+\w+\s*\(/, // Java/C++
      /\bconst\s+\w+\s*=\s*(async\s*)?\(/,  // Arrow functions
      /\b\w+\s*:\s*\([^)]*\)\s*=>/,   // TypeScript arrow
    ];

    return patterns.some(p => p.test(line));
  }

  private extractFunctionContext(code: string, functionName: string, language: string): string | null {
    const lines = code.split('\n');
    let startIndex = -1;
    let braceCount = 0;
    let inFunction = false;
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for function definition
      if (!inFunction && line.includes(functionName)) {
        const defPatterns: Record<string, RegExp> = {
          python: new RegExp(`\\bdef\\s+${functionName}\\s*\\(`),
          javascript: new RegExp(`(function\\s+${functionName}|const\\s+${functionName}\\s*=|${functionName}\\s*[:=]\\s*(async\\s*)?[[(])`),
          typescript: new RegExp(`(function\\s+${functionName}|const\\s+${functionName}\\s*=|${functionName}\\s*[:=]\\s*(async\\s*)?[[(])`),
          java: new RegExp(`\\b\\w+\\s+${functionName}\\s*\\(`),
          go: new RegExp(`\\bfunc\\s+(\\([^)]+\\)\\s*)?${functionName}\\s*\\(`),
          rust: new RegExp(`\\bfn\\s+${functionName}\\s*[<(]`),
          c: new RegExp(`\\b\\w+\\s+${functionName}\\s*\\(`),
          cpp: new RegExp(`\\b\\w+\\s+${functionName}\\s*\\(`)
        };

        const pattern = defPatterns[language];
        if (pattern && pattern.test(line)) {
          startIndex = i;
          inFunction = true;
          braceCount = 0;
        }
      }

      if (inFunction) {
        result.push(line);

        // Count braces
        for (const char of line) {
          if (char === '{' || char === '(') braceCount++;
          if (char === '}' || char === ')') braceCount--;
        }

        // For Python, check indentation
        if (language === 'python') {
          if (result.length > 1 && line.trim() && !line.startsWith(' ') && !line.startsWith('\t')) {
            break;
          }
          if (result.length > 20) break; // Limit size
        } else {
          // For brace languages, check if we've closed the function
          if (braceCount <= 0 && result.length > 1) {
            break;
          }
          if (result.length > 30) break; // Limit size
        }
      }
    }

    if (result.length === 0) {
      return null;
    }

    return result.join('\n');
  }

  private generateQuickHover(name: string, code: string, language: string): string {
    const lines = code.split('\n');
    const firstLine = lines[0].trim();
    const lineCount = lines.length;

    // Extract parameters
    const paramsMatch = firstLine.match(/\(([^)]*)\)/);
    const params = paramsMatch ? paramsMatch[1].trim() : '';

    // Detect if async
    const isAsync = /\basync\b/.test(firstLine);

    // Count complexity indicators
    const ifCount = (code.match(/\bif\b/g) || []).length;
    const loopCount = (code.match(/\b(for|while|loop)\b/g) || []).length;
    const tryCount = (code.match(/\b(try|catch|except)\b/g) || []).length;

    let complexity = 'Simple';
    if (ifCount + loopCount > 5 || lineCount > 30) {
      complexity = 'Complex';
    } else if (ifCount + loopCount > 2 || lineCount > 15) {
      complexity = 'Moderate';
    }

    const parts: string[] = [
      `**${name}**${isAsync ? ' *(async)*' : ''}`,
      '',
      `\`\`\`${language}`,
      firstLine.length > 80 ? firstLine.substring(0, 80) + '...' : firstLine,
      `\`\`\``,
      '',
      `📏 ${lineCount} lines | 🔄 ${complexity} complexity`,
    ];

    if (params) {
      parts.push(`📥 Parameters: \`${params.length > 50 ? params.substring(0, 50) + '...' : params}\``);
    }

    if (tryCount > 0) {
      parts.push(`⚠️ Has error handling`);
    }

    parts.push('', '---', '*Click to analyze full file with CodeXplain*');

    return parts.join('\n');
  }
}
