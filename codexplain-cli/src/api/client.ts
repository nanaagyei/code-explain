export interface RepositoryResponse {
  id: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_files: number;
  processed_files: number;
  url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CodeFileResponse {
  id: number;
  file_path: string;
  language: string;
  status: string;
  complexity_score?: number;
  documentation?: FileDocumentation;
}

export interface FileDocumentation {
  file_path: string;
  language: string;
  complexity: string;
  summary: string;
  functions: FunctionDoc[];
  classes: ClassDoc[];
  stats: { total_lines: number };
  documented_code: string;
}

export interface FunctionDoc {
  name: string;
  params: string[];
  start_line: number;
  end_line: number;
  documentation: string;
}

export interface ClassDoc {
  name: string;
  methods: string[];
  start_line: number;
  end_line: number;
  documentation: string;
}

export interface RepositoryDetailResponse {
  repository: RepositoryResponse;
  files: CodeFileResponse[];
  start_here?: StartHereSummary;
}

export interface StartHereSummary {
  project_summary: string;
  problem_solved: string;
  structure_overview: string;
  entry_points: string[];
  contributor_quickstart?: string;
}

export class CodeXplainClient {
  constructor(private baseUrl: string, private token?: string) {}

  private get headers(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async createRepositoryFromGitHub(repoUrl: string, maxFiles: number): Promise<RepositoryResponse> {
    const formData = new FormData();
    formData.append('github_url', repoUrl);
    formData.append('max_files', String(maxFiles));

    const response = await fetch(`${this.baseUrl}/repositories/github`, {
      method: 'POST',
      headers: this.headers,
      body: formData
    });

    if (!response.ok) {
      const detail = await safeReadError(response);
      throw new Error(detail);
    }

    return response.json();
  }

  async getRepository(repoId: number): Promise<RepositoryDetailResponse> {
    const response = await fetch(`${this.baseUrl}/repositories/${repoId}`, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      const detail = await safeReadError(response);
      throw new Error(detail);
    }

    return response.json();
  }

  async listRepositories(): Promise<RepositoryResponse[]> {
    const response = await fetch(`${this.baseUrl}/repositories`, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      const detail = await safeReadError(response);
      throw new Error(detail);
    }

    return response.json();
  }

  async waitForCompletion(
    repoId: number,
    onProgress?: (status: string, processed: number, total: number) => void,
    pollIntervalMs: number = 3000,
    timeoutMs: number = 600000 // 10 minutes
  ): Promise<RepositoryDetailResponse> {
    const startTime = Date.now();

    while (true) {
      const detail = await this.getRepository(repoId);
      const repo = detail.repository;

      if (onProgress) {
        onProgress(repo.status, repo.processed_files, repo.total_files);
      }

      if (repo.status === 'completed') {
        return detail;
      }

      if (repo.status === 'failed') {
        throw new Error('Repository analysis failed');
      }

      if (Date.now() - startTime > timeoutMs) {
        throw new Error('Analysis timed out');
      }

      await sleep(pollIntervalMs);
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

  async compareRepositories(
    repo1Id: number,
    repo2Id: number
  ): Promise<{ repo1: { id: number; name: string }; repo2: { id: number; name: string }; comparison: string; tokens_used: number }> {
    const formData = new FormData();
    formData.append('repo1_id', String(repo1Id));
    formData.append('repo2_id', String(repo2Id));

    const response = await fetch(`${this.baseUrl}/repositories/compare`, {
      method: 'POST',
      headers: this.headers,
      body: formData
    });

    if (!response.ok) {
      const detail = await safeReadError(response);
      throw new Error(detail);
    }

    return response.json();
  }

  async getPrChecklist(repoId: number): Promise<{ repository: string; checklist: string; tokens_used: number }> {
    const response = await fetch(`${this.baseUrl}/repositories/${repoId}/pr-checklist`, {
      method: 'POST',
      headers: this.headers
    });

    if (!response.ok) {
      const detail = await safeReadError(response);
      throw new Error(detail);
    }

    return response.json();
  }

  async explainChangelog(repoId: number, changelog: string): Promise<{ repository: string; explanation: string; tokens_used: number }> {
    const formData = new FormData();
    formData.append('changelog', changelog);

    const response = await fetch(`${this.baseUrl}/repositories/${repoId}/explain-changelog`, {
      method: 'POST',
      headers: this.headers,
      body: formData
    });

    if (!response.ok) {
      const detail = await safeReadError(response);
      throw new Error(detail);
    }

    return response.json();
  }
}

async function safeReadError(response: Response): Promise<string> {
  try {
    const data = await response.json() as { detail?: unknown };
    if (data && data.detail) {
      return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
    return response.statusText || `HTTP ${response.status}`;
  } catch {
    return response.statusText || `HTTP ${response.status}`;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
