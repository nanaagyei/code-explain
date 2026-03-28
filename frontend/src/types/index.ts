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
  url?: string;
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

export interface StartHereSummary {
  project_summary: string;
  problem_solved: string;
  structure_overview: string;
  entry_points: string[];
  contributor_quick_start: {
    setup: string;
    active_areas: string[];
    common_patterns: string[];
  };
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

export interface HealthScoreData {
  score: number;
  grade: string;
  summary: string;
  metrics: Record<string, number>;
  breakdown: Record<string, string>;
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

// API Response Types
export interface CodeReviewResponse {
  code_review: CodeReviewData;
  processing_time: number;
  cached: boolean;
}

export interface QualityMetricsResponse {
  health_score: HealthScoreData;
  processing_time: number;
  cached: boolean;
}

export interface ArchitectureDiagramResponse {
  architecture_diagram: ArchitectureDiagramData;
  processing_time: number;
  cached: boolean;
}

export interface TraceFileResponse {
  upstream: string[];
  downstream: string[];
  role: string;
}

// ========== Billing ==========

export interface CreditPack {
  id: number;
  name: string;
  description?: string;
  credits: number;
  price_cents: number;
  currency: string;
  stripe_price_id?: string;
  is_active: boolean;
  sort_order: number;
}

export interface UserCreditWallet {
  id: number;
  user_id: number;
  balance_credits: number;
  lifetime_credits_purchased: number;
  lifetime_credits_spent: number;
  last_recalculated_at?: string;
  updated_at?: string;
}

export interface CreditTransaction {
  id: number;
  wallet_id: number;
  transaction_type: string;
  credits_delta: number;
  balance_after: number;
  tokens?: number;
  description?: string;
  source?: string;
  metadata?: Record<string, unknown> | null;
  repository_id?: number;
  code_file_id?: number;
  created_at: string;
}

export interface BillingSummary {
  wallet: UserCreditWallet;
  tokens_per_credit: number;
  estimated_token_cost_per_credit: number;
  has_user_provided_api_key: boolean;
}

export interface StripeCheckoutSession {
  session_id: string;
  url: string;
  expires_at: string;
  amount_total: number;
  currency: string;
  status: string;
}

// ========== Integrations / Analytics / Collaboration ==========

export interface QualityWeights {
  readability: number;
  maintainability: number;
  security: number;
  performance: number;
  testability: number;
}

export interface QualitySnapshot {
  id: number;
  repository_id: number;
  code_file_id: number;
  source: string;
  health_score: HealthScoreData;
  created_at: string;
}

export interface QualityAggregate {
  repository_id: number;
  total_snapshots: number;
  average_score: number;
  latest_score?: number | null;
  latest_grade?: string | null;
  metrics_average: Record<string, number>;
}

export interface AnalyticsOverview {
  repositories_total: number;
  completed_repositories: number;
  files_total: number;
  average_health_score: number;
  total_tokens_used: number;
  total_credits_charged: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  average_score: number;
  snapshots: number;
}

export interface AnalyticsTrends {
  days: number;
  points: AnalyticsTrendPoint[];
}

export interface RepositoryBenchmark {
  repository_id: number;
  repository_name: string;
  average_score: number;
  latest_score?: number | null;
  snapshots: number;
}

export interface RepositoryBenchmarks {
  items: RepositoryBenchmark[];
}

export interface WebhookEndpoint {
  id: number;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CollaborationNote {
  id: number;
  content: string;
  user_id: number;
  created_at: string;
}

export interface CollaborationSession {
  id: number;
  repository_id: number;
  saved_exploration_id?: number | null;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  notes: CollaborationNote[];
}

export interface GitHubPRAnalysis {
  owner: string;
  repo: string;
  pr_number: number;
  head_sha?: string | null;
  action: string;
  status: string;
  summary?: string | null;
  result_payload?: Record<string, unknown> | null;
  updated_at?: string | null;
}
