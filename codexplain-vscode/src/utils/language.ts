const extensionMap: Record<string, string> = {
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

export function detectLanguageFromPath(filePath: string): string | null {
  const lower = filePath.toLowerCase();
  const match = Object.keys(extensionMap).find((ext) => lower.endsWith(ext));
  return match ? extensionMap[match] : null;
}
