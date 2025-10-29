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
  PromptTemplate,
  PromptTemplateCreate,
  PromptTemplateUpdate,
  UserApiKey,
  UserApiKeyCreate,
  UserApiKeyUpdate,
  BatchJob,
  BatchJobCreate,
  BatchJobUpdate,
  BatchJobSummary,
  BatchJobStats,
  CodeReviewResponse,
  QualityMetricsResponse,
  ArchitectureDiagramResponse,
  MentorInsightsResponse,
  BatchAnalysisRequest,
  BatchAnalysisResponse
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
          window.location.href = '/login';
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

  async getRepository(id: number): Promise<{ repository: Repository; files: CodeFile[] }> {
    const response = await this.client.get(`/repositories/${id}`);
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

  async exportDocumentation(repositoryId: number, fileId: number, format: string = 'markdown'): Promise<Blob> {
    const response = await this.client.get(
      `/repositories/${repositoryId}/files/${fileId}/export?format=${format}`,
      { responseType: 'blob' }
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

  // ========== Batch Jobs ==========
  
  async getBatchJobs(status?: string): Promise<BatchJobSummary[]> {
    const params = new URLSearchParams();
    if (status) params.append('status_filter', status);
    
    const response = await this.client.get<BatchJobSummary[]>(`/batch-jobs/?${params.toString()}`);
    return response.data;
  }

  async getBatchJob(id: number): Promise<BatchJob> {
    const response = await this.client.get<BatchJob>(`/batch-jobs/${id}`);
    return response.data;
  }

  async createBatchJob(batchJob: BatchJobCreate): Promise<BatchJob> {
    const response = await this.client.post<BatchJob>('/batch-jobs/', batchJob);
    return response.data;
  }

  async updateBatchJob(id: number, batchJob: BatchJobUpdate): Promise<BatchJob> {
    const response = await this.client.put<BatchJob>(`/batch-jobs/${id}`, batchJob);
    return response.data;
  }

  async deleteBatchJob(id: number): Promise<void> {
    await this.client.delete(`/batch-jobs/${id}`);
  }

  async cancelBatchJob(id: number): Promise<BatchJob> {
    const response = await this.client.post<BatchJob>(`/batch-jobs/${id}/cancel`);
    return response.data;
  }

  async getBatchJobStats(): Promise<BatchJobStats> {
    const response = await this.client.get<BatchJobStats>('/batch-jobs/stats');
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

  async generateMentorInsights(repoId: number, fileId: number): Promise<MentorInsightsResponse> {
    const response = await this.client.post(`/code-analysis/repositories/${repoId}/files/${fileId}/mentor`);
    return response.data;
  }

  async batchAnalyzeRepository(repoId: number, request: BatchAnalysisRequest): Promise<BatchAnalysisResponse> {
    const response = await this.client.post(`/code-analysis/repositories/${repoId}/analyze-all`, request);
    return response.data;
  }

  // ========== WebSocket ==========
  
  createWebSocket(repositoryId: number): WebSocket {
    const token = localStorage.getItem('access_token');
    const wsUrl = `ws://localhost:8000/repositories/ws/${repositoryId}${token ? `?token=${token}` : ''}`;
    return new WebSocket(wsUrl);
  }
}

export const apiClient = new ApiClient();
