import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { getUserFriendlyError } from '../utils/errorMessages';
import type { CodeFile, WebSocketMessage } from '../types/index';
import { 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Clock, 
  FolderOpen,
  ClipboardList,
  AlertCircle,
  Github,
  ExternalLink,
  Share2,
  Bookmark,
  Copy,
  Check,
  FileText,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';

export default function RepositoryDetail() {
  const { id } = useParams<{ id: string }>();
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['repository', id],
    queryFn: () => apiClient.getRepository(parseInt(id!)),
    refetchInterval: (query) => {
      const status = query.state.data?.repository?.status;
      return status === 'processing' ? 3000 : false;
    },
    refetchIntervalInBackground: false,
  });

  const repository = data?.repository;
  const files = data?.files || [];
  const startHere = data?.start_here;
  const entryPoints = startHere?.entry_points ?? [];
  const activeAreas = startHere?.contributor_quick_start?.active_areas ?? [];
  const commonPatterns = startHere?.contributor_quick_start?.common_patterns ?? [];

  const { data: goodFirstIssues = [] } = useQuery({
    queryKey: ['goodFirstIssues', id],
    queryFn: () => apiClient.getGoodFirstIssues(parseInt(id!)),
    enabled: !!id && repository?.status === 'completed' && !!repository?.url && repository.url.includes('github.com'),
  });

  // Save & Share state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);

  const { data: explorations = [] } = useQuery({
    queryKey: ['explorations', id],
    queryFn: () => apiClient.listExplorations(parseInt(id!)),
    enabled: !!id && repository?.status === 'completed',
  });

  const saveExplorationMutation = useMutation({
    mutationFn: () => apiClient.saveExploration(
      parseInt(id!),
      saveTitle,
      saveDescription,
      { viewedFiles: files.map(f => f.id) }
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['explorations', id] });
      setShowSaveModal(false);
      setSaveTitle('');
      setSaveDescription('');
    },
  });

  const markFailedMutation = useMutation({
    mutationFn: () => apiClient.markRepositoryFailed(parseInt(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repository', id] });
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
    },
  });

  const copyShareUrl = (shareUrl: string) => {
    navigator.clipboard.writeText(window.location.origin + shareUrl);
    setCopiedShareUrl(true);
    setTimeout(() => setCopiedShareUrl(false), 2000);
  };

  // Changelog Explainer state
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [changelogInput, setChangelogInput] = useState('');
  const [changelogExpanded, setChangelogExpanded] = useState(true);

  const changelogMutation = useMutation({
    mutationFn: () => apiClient.explainChangelog(parseInt(id!), changelogInput),
    onSuccess: () => setShowChangelogModal(false),
  });

  // PR Checklist state
  const [showPRChecklist, setShowPRChecklist] = useState(false);

  const prChecklistMutation = useMutation({
    mutationFn: () => apiClient.generatePRChecklist(parseInt(id!)),
  });

  // WebSocket for real-time updates
  useEffect(() => {
    if (!id || !repository) return;
    
    // Don't reconnect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = apiClient.createWebSocket(parseInt(id));
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
      setLogs((prev) => [...prev, '[CONNECTED] Connected to server']);
    };

    ws.onmessage = (event) => {
      const data: WebSocketMessage = JSON.parse(event.data);
      
      setLogs((prev) => [...prev, `[INFO] ${data.message}`]);

      if (data.type === 'progress' && data.progress !== undefined) {
        setProgress(data.progress);
        // Invalidate query to refetch
        queryClient.invalidateQueries({ queryKey: ['repository', id] });
      } else if (data.type === 'completed') {
        setProgress(100);
        // Invalidate query to refetch
        queryClient.invalidateQueries({ queryKey: ['repository', id] });
        setLogs((prev) => [...prev, '[SUCCESS] All processing complete!']);
      } else if (data.type === 'failed') {
        setProgress(0);
        queryClient.invalidateQueries({ queryKey: ['repository', id] });
        setLogs((prev) => [...prev, '[ERROR] Processing failed']);
      }
    };

    ws.onerror = () => {
      setWsConnected(false);
      setLogs((prev) => [...prev, '[ERROR] Connection error']);
    };

    ws.onclose = () => {
      setWsConnected(false);
      setLogs((prev) => [...prev, '[DISCONNECTED] Disconnected from server']);
      wsRef.current = null;
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [id, repository, queryClient]);

  const getFileStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600 animate-pulse';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getFileIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5" />;
      case 'processing': return <Zap className="w-5 h-5 animate-pulse" />;
      case 'failed': return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-slate-300 border-t-blue-600" />
          <p className="mt-4 text-slate-600 font-medium">Loading repository...</p>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <AlertCircle className="w-16 h-16 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Repository not found</h2>
          <BackButton to="/dashboard" label="Back to Dashboard" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 lg:mb-8">
          <BackButton to="/dashboard" label="Back to Dashboard" />
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            <h1 className="font-display font-bold text-xl sm:text-2xl text-charcoal-950 break-words min-w-0 flex-1">{repository.name}</h1>
            <span className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
              repository.status === 'completed' ? 'bg-success-50 text-success-700 border border-success-200' :
              repository.status === 'processing' ? 'bg-primary-50 text-primary-700 border border-primary-200' :
              repository.status === 'failed' ? 'bg-danger-50 text-danger-700 border border-danger-200' :
              'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {repository.status}
            </span>
          </div>
        </div>

        {repository.status === 'processing' && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-charcoal-950 flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse flex-shrink-0" />
                <span className="truncate">Processing Documentation...</span>
              </h3>
              <span className="text-sm font-medium text-primary-600 flex-shrink-0">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-success-500 animate-pulse' : 'bg-danger-500'}`} />
                <span className="text-xs text-slate-600">
                  {wsConnected ? 'Live updates active' : 'Connecting...'}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => markFailedMutation.mutate()}
                  disabled={markFailedMutation.isPending}
                  className="text-xs font-medium text-amber-700 hover:text-amber-800 hover:underline disabled:opacity-50"
                >
                  {markFailedMutation.isPending ? 'Marking…' : 'Stuck? Mark as failed'}
                </button>
                {markFailedMutation.isError && (
                  <span className="text-xs text-red-600">
                    {getUserFriendlyError(markFailedMutation.error, { operation: 'mark as failed' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-blue-100 text-sm font-medium mb-1">Total Files</p>
            <p className="text-4xl font-bold">{repository.total_files}</p>
          </div>
          
          <div className="bg-green-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-green-100 text-sm font-medium mb-1">Processed</p>
            <p className="text-4xl font-bold">{repository.processed_files}</p>
          </div>
          
          <div className="bg-blue-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-blue-100 text-sm font-medium mb-1">Completion</p>
            <p className="text-4xl font-bold">
              {repository.total_files > 0
                ? Math.round((repository.processed_files / repository.total_files) * 100)
                : 0}%
            </p>
          </div>
        </div>

        {/* Start Here Summary */}
        {repository.status === 'completed' && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Start Here</h3>
              {!startHere && (
                <span className="text-xs text-gray-500">Generating summary…</span>
              )}
            </div>
            {startHere ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">What is this project?</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{startHere.project_summary}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">What problem does it solve?</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{startHere.problem_solved}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">How is it structured?</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{startHere.structure_overview}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Where should I start reading?</h4>
                  <div className="flex flex-wrap gap-2">
                    {entryPoints.map((entry) => (
                      <span
                        key={entry}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {entry}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h5 className="text-xs font-semibold text-gray-700 mb-2">Contributor Quick Start</h5>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {startHere.contributor_quick_start?.setup ?? 'Not specified yet.'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h5 className="text-xs font-semibold text-gray-700 mb-2">Active Areas</h5>
                    <div className="flex flex-wrap gap-2">
                      {activeAreas.map((area) => (
                        <span key={area} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-full text-gray-600">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h5 className="text-xs font-semibold text-gray-700 mb-2">Common Patterns</h5>
                    <div className="flex flex-wrap gap-2">
                      {commonPatterns.map((pattern) => (
                        <span key={pattern} className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-full text-gray-600">
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                We’re building a beginner-friendly Start Here guide for this repository. Check back in a moment.
              </p>
            )}
          </div>
        )}

        {/* Good First Issues */}
        {repository.status === 'completed' && repository.url && repository.url.includes('github.com') && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Github className="w-5 h-5 text-gray-700" />
                <h3 className="text-xl font-bold text-gray-900">Contribution Opportunities</h3>
              </div>
            </div>
            {goodFirstIssues.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  These are great starting points for contributing to this repository:
                </p>
                {goodFirstIssues.map((issue) => (
                  <a
                    key={issue.number}
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition">
                            #{issue.number}: {issue.title}
                          </h4>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                        </div>
                        {issue.body && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {issue.body}
                          </p>
                        )}
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>{issue.comments} comments</span>
                          <span>•</span>
                          <span>Updated {new Date(issue.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                No "good first issue" labeled issues found. Check the repository on GitHub for contribution opportunities.
              </p>
            )}
          </div>
        )}

        {/* Files List */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <span>Files ({files.length})</span>
          </h3>
          
          <div className="space-y-3">
            {files.map((file: CodeFile) => (
              <Link
                key={file.id}
                to={file.status === 'completed' ? `/repositories/${repository.id}/files/${file.id}` : '#'}
                className={`block p-3 sm:p-4 border-2 rounded-xl transition-all duration-200 ${
                  file.status === 'completed'
                    ? 'border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                    : 'border-gray-100 cursor-default'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                  <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <span className="text-gray-600 flex-shrink-0 mt-0.5 sm:mt-0">{getFileIcon(file.status)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{file.file_path}</p>
                      <div className="flex items-center flex-wrap gap-2 mt-1.5 sm:mt-1">
                        <span className="text-xs text-gray-500 px-2 py-0.5 sm:py-1 bg-gray-100 rounded whitespace-nowrap">
                          {file.language}
                        </span>
                        {file.complexity_score !== null && (
                          <span className={`text-xs px-2 py-0.5 sm:py-1 rounded whitespace-nowrap ${
                            file.complexity_score < 5 ? 'bg-green-100 text-green-700' :
                            file.complexity_score < 10 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            Complexity: {file.complexity_score}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0 ${getFileStatusColor(file.status)}`}>
                    {file.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Processing Logs */}
        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-2xl shadow-xl p-4 sm:p-6 overflow-hidden">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center">
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              <span>Processing Logs</span>
            </h3>
            <div className="bg-black/30 rounded-lg p-3 sm:p-4 max-h-96 overflow-y-auto font-mono text-xs sm:text-sm scrollbar-hide">
              {logs.map((log, idx) => (
                <div key={idx} className="text-gray-300 mb-1 hover:bg-gray-800/50 px-2 py-1 rounded transition duration-150 break-words">
                  <span className="text-gray-500 mr-2 whitespace-nowrap">
                    [{new Date().toLocaleTimeString()}]
                  </span>
                  <span className="break-words">{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Explorations */}
        {repository.status === 'completed' && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Saved Explorations</h3>
              </div>
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Save & Share</span>
              </button>
            </div>
            
            {explorations.length > 0 ? (
              <div className="space-y-3">
                {explorations.map((exp) => (
                  <div key={exp.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                        {exp.description && (
                          <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {exp.view_count} views • Created {new Date(exp.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => copyShareUrl(exp.share_url)}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-100 transition flex items-center space-x-1"
                      >
                        {copiedShareUrl ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedShareUrl ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                No saved explorations yet. Save your current exploration to share with others.
              </p>
            )}
          </div>
        )}

        {/* Developer Tools */}
        {repository.status === 'completed' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Changelog Explainer */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Changelog Explainer</h3>
                </div>
                <button
                  onClick={() => setShowChangelogModal(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Analyze
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Paste your CHANGELOG or commit history to get a plain-language explanation of what changed.
              </p>
              
              {changelogMutation.data && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setChangelogExpanded(!changelogExpanded)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="font-medium text-gray-900">Analysis Results</span>
                    {changelogExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {changelogExpanded && (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm text-gray-700">{changelogMutation.data.explanation.summary}</p>
                      {changelogMutation.data.explanation.major_changes.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Major Changes</h4>
                          <ul className="space-y-1">
                            {changelogMutation.data.explanation.major_changes.slice(0, 3).map((c, i) => (
                              <li key={i} className="text-sm text-gray-700">• {c.title}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PR Checklist */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <ListChecks className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900">Before You PR</h3>
                </div>
                <button
                  onClick={() => {
                    setShowPRChecklist(true);
                    prChecklistMutation.mutate();
                  }}
                  disabled={prChecklistMutation.isPending}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center space-x-1"
                >
                  {prChecklistMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Generate</span>
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Get an AI-generated checklist to review before submitting your pull request.
              </p>
              
              {prChecklistMutation.data && showPRChecklist && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-2">
                    {prChecklistMutation.data.checklist.checklist.slice(0, 5).map((item, i) => (
                      <label key={i} className="flex items-start space-x-2 text-sm">
                        <input type="checkbox" className="mt-0.5 rounded border-gray-300" />
                        <span className="text-gray-700">{item.item}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          item.priority === 'required' ? 'bg-red-100 text-red-700' :
                          item.priority === 'recommended' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {item.priority}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Complexity: {prChecklistMutation.data.checklist.estimated_review_complexity}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Exploration Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Save Exploration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="My exploration of this codebase"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Brief description of what you explored..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => saveExplorationMutation.mutate()}
                disabled={!saveTitle.trim() || saveExplorationMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saveExplorationMutation.isPending ? 'Saving...' : 'Save & Get Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Changelog Explainer Modal */}
      {showChangelogModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Explain Changelog</h3>
            <p className="text-sm text-gray-600 mb-4">
              Paste your CHANGELOG.md content or git commit history below.
            </p>
            <textarea
              value={changelogInput}
              onChange={(e) => setChangelogInput(e.target.value)}
              placeholder="## [1.2.0] - 2024-01-15&#10;### Added&#10;- New feature X&#10;### Fixed&#10;- Bug in Y..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowChangelogModal(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => changelogMutation.mutate()}
                disabled={!changelogInput.trim() || changelogMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center space-x-2"
              >
                {changelogMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Explain Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
