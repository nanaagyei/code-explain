import type { CancellationToken } from 'vscode';

export interface ExplainSelectionRequest {
  code: string;
  name: string;
  context?: string;
  language: string;
}

export interface QuickFileAnalysisRequest {
  code: string;
  language: string;
  file_path: string;
  repo_name?: string;
}

export interface HealthScoreData {
  score: number;
  grade: string;
  summary: string;
  metrics: Record<string, number>;
  breakdown: Record<string, string>;
}

export interface QuickFileAnalysisResponse {
  summary: string;
  health_score: HealthScoreData;
  tokens_used: number;
}

export class CodeXplainClient {
  constructor(private baseUrl: string, private token?: string) {}

  async quickFileAnalysis(
    payload: QuickFileAnalysisRequest,
    cancellationToken?: CancellationToken
  ): Promise<QuickFileAnalysisResponse> {
    const controller = new AbortController();

    // Handle cancellation
    const cancelListener = cancellationToken?.onCancellationRequested(() => {
      controller.abort();
    });

    try {
      const response = await fetch(`${this.baseUrl}/code-analysis/quick-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        const detail = await safeReadError(response);
        throw new Error(detail);
      }

      return (await response.json()) as QuickFileAnalysisResponse;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Analysis cancelled');
      }
      throw error;
    } finally {
      cancelListener?.dispose();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async explainSelection(
    payload: ExplainSelectionRequest,
    cancellationToken?: CancellationToken
  ): Promise<string> {
    const controller = new AbortController();
    const cancelListener = cancellationToken?.onCancellationRequested(() => {
      controller.abort();
    });

    try {
      const response = await fetch(`${this.baseUrl}/chat/explain-function`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify({
          code: payload.code,
          name: payload.name,
          context: payload.context ?? null,
          language: payload.language
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const detail = await safeReadError(response);
        throw new Error(detail);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let explanation = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6)) as {
              chunk?: string;
              done?: boolean;
              error?: string;
            };
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.chunk) {
              explanation += data.chunk;
            }
            if (data.done) {
              streamDone = true;
              break;
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      return explanation;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Explanation cancelled');
      }
      throw error;
    } finally {
      cancelListener?.dispose();
    }
  }
}

async function safeReadError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (data && data.detail) {
      return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
    return response.statusText || `HTTP ${response.status}`;
  } catch {
    return response.statusText || `HTTP ${response.status}`;
  }
}
