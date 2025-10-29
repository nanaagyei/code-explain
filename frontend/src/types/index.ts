export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Repository {
  id: number;
  name: string;
  user_id: number;
  total_files: number;
  processed_files: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at?: string;
}

export interface CodeFile {
  id: number;
  repository_id: number;
  file_path: string;
  language: string;
  content_hash: string;
  original_content: string;
  documented_content: string;
  documentation: FileDocumentation | null;
  complexity_score: number | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at?: string;
}

export interface FileDocumentation {
  file_path: string;
  language: string;
  summary: string;
  functions: FunctionDocumentation[];
  classes: ClassDocumentation[];
  complexity: string;
  stats: {
    total_lines: number;
    non_empty_lines: number;
    max_depth: number;
  };
  documented_code: string;
}

export interface FunctionDocumentation {
  name: string;
  params: string[];
  start_line: number;
  end_line: number;
  documentation: string;
}

export interface ClassDocumentation {
  name: string;
  methods: string[];
  start_line: number;
  end_line: number;
  documentation: string;
}

export interface ParameterInfo {
  name: string;
  type: string;
  default_value?: string;
  description: string;
}

export interface WebSocketMessage {
  type: 'progress' | 'status' | 'error' | 'completed' | 'failed';
  repository_id: number;
  file_id?: number;
  message: string;
  progress?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface PromptTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  language_preference?: string;
  is_default: boolean;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at?: string;
}

export interface PromptTemplateCreate {
  name: string;
  description: string;
  system_prompt: string;
  function_prompt: string;
  class_prompt: string;
  file_prompt: string;
  category: string;
  language_preference?: string;
  is_default: boolean;
  is_public: boolean;
}

export interface PromptTemplateUpdate {
  name?: string;
  description?: string;
  system_prompt?: string;
  function_prompt?: string;
  class_prompt?: string;
  file_prompt?: string;
  category?: string;
  language_preference?: string;
  is_default?: boolean;
  is_public?: boolean;
}

export interface UserApiKey {
  id: number;
  user_id: number;
  name: string;
  provider: string;
  key_prefix: string;
  is_active: boolean;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserApiKeyCreate {
  name: string;
  provider: string;
  api_key: string;
  is_active: boolean;
}

export interface UserApiKeyUpdate {
  name?: string;
  is_active?: boolean;
}

// ========== Batch Jobs ==========

export type BatchJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'paused';
export type BatchJobItemStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

export interface BatchJobItem {
  id: number;
  batch_job_id: number;
  repository_id?: number;
  name: string;
  source_type: string;
  source_data?: Record<string, unknown>;
  status: BatchJobItemStatus;
  error_message?: string;
  processing_time?: number;
  created_at: string;
  updated_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface BatchJobItemCreate {
  name: string;
  source_type: string;
  source_data?: Record<string, unknown>;
}

export interface BatchJob {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  status: BatchJobStatus;
  total_items: number;
  completed_items: number;
  failed_items: number;
  progress: number;
  meta_info?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  started_at?: string;
  completed_at?: string;
  items?: BatchJobItem[];
}

export interface BatchJobCreate {
  name: string;
  description?: string;
  meta_info?: Record<string, unknown>;
  items: BatchJobItemCreate[];
}

export interface BatchJobUpdate {
  name?: string;
  description?: string;
  status?: BatchJobStatus;
}

export interface BatchJobSummary {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  status: BatchJobStatus;
  total_items: number;
  completed_items: number;
  failed_items: number;
  progress: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface BatchJobStats {
  total_jobs: number;
  pending_jobs: number;
  processing_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  cancelled_jobs: number;
  total_repositories: number;
  completed_repositories: number;
  failed_repositories: number;
}

// ========== Code Analysis Features ==========

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  line_number: number;
  description: string;
  fix_suggestion: string;
}

export interface PerformanceIssue {
  impact: 'high' | 'medium' | 'low';
  type: string;
  line_number: number;
  description: string;
  optimization_suggestion: string;
}

export interface BestPractice {
  category: string;
  description: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CodeReviewData {
  security_issues: SecurityIssue[];
  performance_issues: PerformanceIssue[];
  best_practices: BestPractice[];
  overall_score: number;
  summary: string;
}

export interface QualityMetricsData {
  maintainability: number;  // 0-100
  testability: number;
  readability: number;
  performance: number;
  security: number;
  overall: number;
  breakdown: Record<string, string>;  // explanations for each metric
}

export interface ArchitectureNode {
  id: string;
  type: 'function' | 'class' | 'module' | 'api';
  label: string;
  description: string;
  metadata: Record<string, unknown>;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: 'calls' | 'imports' | 'depends_on';
}

export interface ArchitectureDiagramData {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  layout: 'horizontal' | 'vertical' | 'circular';
}

export interface LearningPathItem {
  title: string;
  description: string;
  resources: string[];  // URLs, book titles, etc.
  estimated_time: string;  // "2 hours", "1 week", etc.
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
}

export interface Challenge {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: string;
  skills_practiced: string[];
  starter_code?: string;
}

export interface MentorInsight {
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  strengths: string[];
  weaknesses: string[];
  learning_path: LearningPathItem[];
  challenges: Challenge[];
  estimated_time: string;
  next_milestone: string;
}

// API Response Types
export interface CodeReviewResponse {
  code_review: CodeReviewData;
  processing_time: number;
  cached: boolean;
}

export interface QualityMetricsResponse {
  quality_metrics: QualityMetricsData;
  processing_time: number;
  cached: boolean;
}

export interface ArchitectureDiagramResponse {
  architecture_diagram: ArchitectureDiagramData;
  processing_time: number;
  cached: boolean;
}

export interface MentorInsightsResponse {
  mentor_insights: MentorInsight;
  processing_time: number;
  cached: boolean;
}

export interface BatchAnalysisRequest {
  analysis_types: string[];  // ["review", "quality", "architecture", "mentor"]
  force_regenerate: boolean;
}

export interface BatchAnalysisResponse {
  results: Record<string, unknown>;  // analysis_type -> result
  processing_time: number;
  cached_counts: Record<string, number>;
}