/**
 * API Client for CodeExplain backend
 * 
 * Features:
 * - Automatic authentication token management
 * - Request/response interceptors
 * - Error handling
 * - TypeScript type safety
 */
import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import type {
  User,
  Repository,
  CodeFile,
  FileDocumentation,
  StartHereSummary,
  PromptTemplate,
  PromptTemplateCreate,
  PromptTemplateUpdate,
  UserApiKey,
  UserApiKeyCreate,
  UserApiKeyUpdate,
  CodeReviewResponse,
  QualityMetricsResponse,
  ArchitectureDiagramResponse,
  TraceFileResponse,
  CreditPack,
  BillingSummary,
  CreditTransaction,
  StripeCheckoutSession
} from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Auto-logout on 401 Unauthorized
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ========== Authentication ==========
  
  async register(username: string, email: string, password: string): Promise<User> {
    const response = await this.client.post<User>('/auth/register', { username, email, password });
    return response.data;
  }

  async login(username: string, password: string): Promise<{ user: User; access_token: string }> {
    // OAuth2PasswordRequestForm expects form data
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await this.client.post<{ user: User; access_token: string }>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    // Store token
    localStorage.setItem('access_token', response.data.access_token);
    
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }

  // ========== Repositories ==========
  
  async createRepository(name: string, files: File[], promptTemplateId?: number): Promise<Repository> {
    const formData = new FormData();
    formData.append('name', name);
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    if (promptTemplateId) {
      formData.append('prompt_template_id', promptTemplateId.toString());
    }

    const response = await this.client.post<Repository>('/repositories/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data;
  }

  async createRepositoryFromGitHub(githubUrl: string, maxFiles: number = 100, promptTemplateId?: number): Promise<Repository> {
    const formData = new FormData();
    formData.append('github_url', githubUrl);
    formData.append('max_files', maxFiles.toString());

    if (promptTemplateId) {
      formData.append('prompt_template_id', promptTemplateId.toString());
    }

    const response = await this.client.post<Repository>('/repositories/github', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data;
  }

  async getRepositories(): Promise<Repository[]> {
    const response = await this.client.get<Repository[]>('/repositories/');
    return response.data;
  }

  async getRepository(id: number): Promise<{ repository: Repository; files: CodeFile[]; start_here?: StartHereSummary }> {
    const response = await this.client.get(`/repositories/${id}`);
    return response.data;
  }

  async getGoodFirstIssues(repositoryId: number): Promise<Array<{
    number: number;
    title: string;
    body: string;
    url: string;
    labels: string[];
    created_at: string;
    updated_at: string;
    comments: number;
  }>> {
    const response = await this.client.get(`/repositories/${repositoryId}/good-first-issues`);
    return response.data;
  }

  async getFileDocumentation(
    repositoryId: number,
    fileId: number
  ): Promise<FileDocumentation> {
    const response = await this.client.get<FileDocumentation>(
      `/repositories/${repositoryId}/files/${fileId}`
    );
    return response.data;
  }

  async deleteRepository(id: number): Promise<void> {
    await this.client.delete(`/repositories/${id}`);
  }

  async markRepositoryFailed(id: number): Promise<void> {
    await this.client.post(`/repositories/${id}/mark-failed`);
  }

  async exportDocumentation(repositoryId: number, fileId: number, format: string = 'markdown'): Promise<Blob> {
    const response = await this.client.get(
      `/repositories/${repositoryId}/files/${fileId}/export?format=${format}`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  async getFileTrace(repositoryId: number, fileId: number): Promise<TraceFileResponse> {
    const response = await this.client.get<TraceFileResponse>(
      `/repositories/${repositoryId}/files/${fileId}/trace`
    );
    return response.data;
  }

  // ========== Prompt Templates ==========
  
  async getPromptTemplates(category?: string, language?: string): Promise<PromptTemplate[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (language) params.append('language', language);
    
    const response = await this.client.get<PromptTemplate[]>(`/prompt-templates/?${params.toString()}`);
    return response.data;
  }

  async getPromptTemplate(id: number): Promise<PromptTemplate> {
    const response = await this.client.get<PromptTemplate>(`/prompt-templates/${id}`);
    return response.data;
  }

  async createPromptTemplate(template: PromptTemplateCreate): Promise<PromptTemplate> {
    const response = await this.client.post<PromptTemplate>('/prompt-templates/', template);
    return response.data;
  }

  async updatePromptTemplate(id: number, template: PromptTemplateUpdate): Promise<PromptTemplate> {
    const response = await this.client.put<PromptTemplate>(`/prompt-templates/${id}`, template);
    return response.data;
  }

  async deletePromptTemplate(id: number): Promise<void> {
    await this.client.delete(`/prompt-templates/${id}`);
  }

  async usePromptTemplate(id: number): Promise<PromptTemplate> {
    const response = await this.client.post<PromptTemplate>(`/prompt-templates/${id}/use`);
    return response.data;
  }

  // ========== User API Keys ==========
  
  async getUserApiKeys(): Promise<UserApiKey[]> {
    const response = await this.client.get<UserApiKey[]>('/user-api-keys/');
    return response.data;
  }

  async getUserApiKey(id: number): Promise<UserApiKey> {
    const response = await this.client.get<UserApiKey>(`/user-api-keys/${id}`);
    return response.data;
  }

  async createUserApiKey(keyData: UserApiKeyCreate): Promise<UserApiKey> {
    const response = await this.client.post<UserApiKey>('/user-api-keys/', keyData);
    return response.data;
  }

  async updateUserApiKey(id: number, keyData: UserApiKeyUpdate): Promise<UserApiKey> {
    const response = await this.client.put<UserApiKey>(`/user-api-keys/${id}`, keyData);
    return response.data;
  }

  async deleteUserApiKey(id: number): Promise<void> {
    await this.client.delete(`/user-api-keys/${id}`);
  }

  async useUserApiKey(id: number): Promise<UserApiKey> {
    const response = await this.client.post<UserApiKey>(`/user-api-keys/${id}/use`);
    return response.data;
  }

  async getDecryptedUserApiKey(id: number): Promise<{ api_key: string; provider: string; name: string }> {
    const response = await this.client.get<{ api_key: string; provider: string; name: string }>(`/user-api-keys/${id}/decrypt`);
    return response.data;
  }

  // ========== Billing ==========

  async getCreditPacks(): Promise<CreditPack[]> {
    const response = await this.client.get<CreditPack[]>('/billing/packs');
    return response.data;
  }

  async getBillingSummary(): Promise<BillingSummary> {
    const response = await this.client.get<BillingSummary>('/billing/wallet');
    return response.data;
  }

  async getBillingTransactions(): Promise<CreditTransaction[]> {
    const response = await this.client.get<CreditTransaction[]>('/billing/transactions');
    return response.data;
  }

  async createCheckoutSession(creditPackId: number): Promise<StripeCheckoutSession> {
    const response = await this.client.post<StripeCheckoutSession>('/billing/checkout', {
      credit_pack_id: creditPackId,
    });
    return response.data;
  }

  // ========== Code Analysis Features ==========

  async generateCodeReview(repoId: number, fileId: number): Promise<CodeReviewResponse> {
    const response = await this.client.post(`/code-analysis/repositories/${repoId}/files/${fileId}/review`);
    return response.data;
  }

  async calculateQualityMetrics(repoId: number, fileId: number): Promise<QualityMetricsResponse> {
    const response = await this.client.post(`/code-analysis/repositories/${repoId}/files/${fileId}/quality`);
    return response.data;
  }

  async generateArchitectureDiagram(repoId: number, fileId: number): Promise<ArchitectureDiagramResponse> {
    const response = await this.client.post(`/code-analysis/repositories/${repoId}/files/${fileId}/architecture`);
    return response.data;
  }

  // ========== Chat / Explain ==========
  
  async explainFunction(
    code: string,
    name: string,
    context?: string,
    language: string = 'python'
  ): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${API_BASE_URL}/chat/explain-function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({ code, name, context, language }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to explain function');
    }
    
    return response.body!;
  }

  // ========== Explorations ==========

  async saveExploration(
    repositoryId: number,
    title: string,
    description?: string,
    state?: Record<string, unknown>
  ): Promise<{ id: number; share_id: string; title: string; share_url: string }> {
    const formData = new FormData();
    formData.append('title', title);
    if (description) formData.append('description', description);
    if (state) formData.append('state', JSON.stringify(state));
    
    const response = await this.client.post(`/repositories/${repositoryId}/explorations`, formData);
    return response.data;
  }

  async getSharedExploration(shareId: string): Promise<{
    id: number;
    title: string;
    description?: string;
    state?: Record<string, unknown>;
    view_count: number;
    created_at: string;
    repository: { id: number; name: string };
  }> {
    const response = await this.client.get(`/repositories/explore/${shareId}`);
    return response.data;
  }

  async listExplorations(repositoryId: number): Promise<Array<{
    id: number;
    share_id: string;
    title: string;
    description?: string;
    view_count: number;
    created_at: string;
    share_url: string;
  }>> {
    const response = await this.client.get(`/repositories/${repositoryId}/explorations`);
    return response.data;
  }

  async compareRepositories(repo1Id: number, repo2Id: number): Promise<{
    repo1: { id: number; name: string };
    repo2: { id: number; name: string };
    comparison: {
      overview: string;
      similarities: string[];
      differences: string[];
      architecture_comparison: string;
      complexity_comparison: string;
      recommendations: string[];
      learning_opportunities: string;
    };
    tokens_used: number;
  }> {
    const formData = new FormData();
    formData.append('repo1_id', repo1Id.toString());
    formData.append('repo2_id', repo2Id.toString());
    const response = await this.client.post('/repositories/compare', formData);
    return response.data;
  }

  async explainChangelog(repositoryId: number, changelog: string): Promise<{
    repository: string;
    explanation: {
      summary: string;
      major_changes: Array<{ title: string; description: string; impact: string }>;
      breaking_changes: string[];
      new_features: string[];
      bug_fixes: string[];
      recommendations: string[];
    };
    tokens_used: number;
  }> {
    const formData = new FormData();
    formData.append('changelog', changelog);
    const response = await this.client.post(`/repositories/${repositoryId}/explain-changelog`, formData);
    return response.data;
  }

  async generatePRChecklist(repositoryId: number): Promise<{
    repository: string;
    checklist: {
      checklist: Array<{ item: string; category: string; priority: string }>;
      potential_issues: string[];
      suggested_reviewers: string[];
      estimated_review_complexity: string;
    };
    tokens_used: number;
  }> {
    const response = await this.client.post(`/repositories/${repositoryId}/pr-checklist`);
    return response.data;
  }

  // ========== WebSocket ==========
  
  createWebSocket(repositoryId: number): WebSocket {
    const token = localStorage.getItem('access_token');
    // Convert HTTP URL to WebSocket URL
    const baseUrl = API_BASE_URL.replace(/^http/, 'ws');
    const wsUrl = `${baseUrl}/repositories/ws/${repositoryId}${token ? `?token=${token}` : ''}`;
    return new WebSocket(wsUrl);
  }
}

export const apiClient = new ApiClient();
