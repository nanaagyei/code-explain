import { useState, useMemo } from 'react';
import type { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { apiClient } from '../api/client';
import BentoChat from '../components/BentoChat';
import { PromptTemplateSelector } from '../components/PromptTemplateSelector';
import OnboardingTour, { useOnboardingTour } from '../components/OnboardingTour';
import type { Repository } from '../types/index';
import { getUserFriendlyError, ErrorContexts } from '../utils/errorMessages';
import {
  FolderIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  FolderIcon as FolderSolidIcon,
  DocumentTextIcon as DocumentSolidIcon,
  CheckCircleIcon as CheckSolidIcon,
  BoltIcon as BoltSolidIcon,
} from '@heroicons/react/24/solid';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Input } from '../components/ui/input';

export default function Dashboard() {
  const queryClient = useQueryClient();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [repositoryName, setRepositoryName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [uploadTab, setUploadTab] = useState<'files' | 'github'>('files');
  const [githubUrl, setGithubUrl] = useState('');
  const [maxFiles, setMaxFiles] = useState(100);
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<number | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);

  // Onboarding tour
  const { showTour, completeTour } = useOnboardingTour();

  const handleBillingError = (error: AxiosError<{ detail?: string }>) => {
    if (error.response?.status === 402) {
      setCreditError(getUserFriendlyError(error));
    }
  };

  // Fetch repositories
  const { data: repositories, isLoading } = useQuery({
    queryKey: ['repositories'],
    queryFn: () => apiClient.getRepositories(),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ name, files, promptTemplateId }: { name: string; files: File[]; promptTemplateId?: number }) =>
      apiClient.createRepository(name, files, promptTemplateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      setShowUploadModal(false);
      setSelectedFiles([]);
      setRepositoryName('');
      setSelectedPromptTemplate(null);
      setCreditError(null);
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      handleBillingError(error);
    },
  });

  // GitHub upload mutation
  const githubMutation = useMutation({
    mutationFn: ({ githubUrl, maxFiles, promptTemplateId }: { githubUrl: string; maxFiles: number; promptTemplateId?: number }) =>
      apiClient.createRepositoryFromGitHub(githubUrl, maxFiles, promptTemplateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      setShowUploadModal(false);
      setGithubUrl('');
      setMaxFiles(100);
      setSelectedPromptTemplate(null);
      setCreditError(null);
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      handleBillingError(error);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteRepository(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      setDeleteConfirmId(null);
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const codeFiles = acceptedFiles.filter((file) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['py', 'js', 'jsx', 'ts', 'tsx', 'java', 'c', 'h', 'cpp', 'hpp', 'go', 'rs'].includes(ext || '');
      });
      setSelectedFiles((prev) => [...prev, ...codeFiles]);
    },
  });

  const handleUpload = () => {
    if (uploadTab === 'files') {
      if (!repositoryName.trim() || selectedFiles.length === 0) return;
      uploadMutation.mutate({ 
        name: repositoryName, 
        files: selectedFiles, 
        promptTemplateId: selectedPromptTemplate || undefined 
      });
    } else {
      if (!githubUrl.trim()) return;
      githubMutation.mutate({ 
        githubUrl, 
        maxFiles, 
        promptTemplateId: selectedPromptTemplate || undefined 
      });
    }
  };

  // Search and filter
  const filteredRepositories = useMemo(() => {
    if (!repositories) return [];
    
    return repositories.filter((repo) => {
      const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || repo.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [repositories, searchQuery, filterStatus]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!repositories) return { total: 0, completed: 0, processing: 0, totalFiles: 0 };
    
    return {
      total: repositories.length,
      completed: repositories.filter(r => r.status === 'completed').length,
      processing: repositories.filter(r => r.status === 'processing').length,
      totalFiles: repositories.reduce((sum, r) => sum + r.total_files, 0),
    };
  }, [repositories]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-50 text-success-700 border-success-200';
      case 'processing': return 'bg-primary-50 text-primary-700 border-primary-200';
      case 'failed': return 'bg-danger-50 text-danger-700 border-danger-200';
      default: return 'bg-neutral-50 text-neutral-700 border-neutral-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': 
        return <CheckCircleIcon className="w-4 h-4 inline" />;
      case 'processing': 
        return <BoltIcon className="w-4 h-4 inline animate-pulse" />;
      case 'failed': 
        return <XCircleIcon className="w-4 h-4 inline" />;
      default: 
        return <div className="w-4 h-4 rounded-full border-2 border-gray-400 inline-block" />;
    }
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="mb-8 lg:mb-10">
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-charcoal-950 tracking-tight">
            Repositories
          </h1>
          <p className="mt-1 text-slate-600 text-sm sm:text-base">
            Upload code or connect GitHub to generate AI documentation.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
          {[
            { label: 'Total', value: stats.total, icon: FolderSolidIcon, color: 'primary', delay: 0 },
            { label: 'Completed', value: stats.completed, icon: CheckSolidIcon, color: 'success', delay: 50 },
            { label: 'Processing', value: stats.processing, icon: BoltSolidIcon, color: 'orange', delay: 100 },
            { label: 'Files', value: stats.totalFiles, icon: DocumentSolidIcon, color: 'slate', delay: 150 },
          ].map(({ label, value, icon: Icon, color, delay }) => (
            <Card
              key={label}
              className="animate-stagger-in border-slate-200/80 bg-white"
              style={{ animationDelay: `${delay}ms` }}
            >
              <CardHeader className="p-4 sm:p-5 pb-0 flex flex-row items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-600">{label}</span>
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center ${
                    color === 'primary'
                      ? 'bg-primary-50'
                      : color === 'success'
                        ? 'bg-success-50'
                        : color === 'orange'
                          ? 'bg-amber-50'
                          : 'bg-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      color === 'primary'
                        ? 'text-primary-600'
                        : color === 'success'
                          ? 'text-success-600'
                          : color === 'orange'
                            ? 'text-amber-600'
                            : 'text-slate-600'
                    } ${color === 'orange' ? 'animate-pulse' : ''}`}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-2">
                <p
                  className={`font-display font-bold text-2xl sm:text-3xl tracking-tight ${
                    color === 'primary'
                      ? 'text-primary-600'
                      : color === 'success'
                        ? 'text-success-600'
                        : color === 'orange'
                          ? 'text-amber-600'
                          : 'text-slate-700'
                  }`}
                >
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Bar */}
        <Card className="mb-6 lg:mb-8 border-slate-200/80 bg-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative flex-1 lg:max-w-sm">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <select
                  value={filterStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
                  className="h-11 px-4 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm font-medium text-slate-700"
                >
                  <option value="all">All status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
                <Button
                  onClick={() => setShowUploadModal(true)}
                  data-tour="upload-button"
                  size="lg"
                  className="font-semibold"
                >
                  <PlusIcon className="w-5 h-5" />
                  New Repository
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-slate-200/80 overflow-hidden">
                <CardContent className="p-6 animate-pulse">
                  <div className="h-5 bg-slate-200 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRepositories && filteredRepositories.length > 0 ? (
          <>
            <p className="font-medium text-slate-600 mb-4">
              {searchQuery || filterStatus !== 'all'
                ? `Found ${filteredRepositories.length} ${filteredRepositories.length === 1 ? 'repository' : 'repositories'}`
                : 'Your repositories'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" data-tour="repositories-list">
              {filteredRepositories.map((repo: Repository, idx: number) => (
                <Card
                  key={repo.id}
                  className="group animate-stagger-in border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200"
                  style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}
                >
                  <Link to={`/repositories/${repo.id}`} className="block">
                    <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-start justify-between gap-2">
                      <h3 className="font-display font-semibold text-lg text-charcoal-950 group-hover:text-primary-600 transition-colors break-words flex-1 min-w-0">
                        {repo.name}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 whitespace-nowrap ${getStatusColor(repo.status)}`}>
                          {getStatusIcon(repo.status)}
                          <span className="hidden sm:inline">{repo.status}</span>
                          <span className="sm:hidden">{repo.status.charAt(0).toUpperCase()}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirmId(repo.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1.5"
                          title="Delete repository"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 pt-0 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Files</span>
                        <span className="font-semibold text-charcoal-950">{repo.total_files}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Processed</span>
                        <span className="font-semibold text-charcoal-950">{repo.processed_files}</span>
                      </div>
                      {repo.status === 'processing' && (
                        <div className="pt-2">
                          <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>Progress</span>
                            <span className="font-semibold">{Math.round((repo.processed_files / repo.total_files) * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 bg-primary-500 rounded-full transition-all duration-300"
                              style={{ width: `${(repo.processed_files / repo.total_files) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="text-slate-500">
                          {new Date(repo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-primary-600 font-medium group-hover:text-primary-700">View details</span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/30">
            <CardContent className="py-16 sm:py-20 text-center px-4">
              <div className="mb-6 flex justify-center">
                <FolderIcon className="w-16 h-16 sm:w-20 sm:h-20 text-slate-400" />
              </div>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-charcoal-950 mb-2">
                {searchQuery || filterStatus !== 'all' ? 'No matches found' : 'No repositories yet'}
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {searchQuery || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Upload code or connect GitHub to generate AI documentation.'}
              </p>
              {!searchQuery && filterStatus === 'all' && (
                <Button size="lg" onClick={() => setShowUploadModal(true)}>
                  <CloudArrowUpIcon className="w-5 h-5" />
                  Upload your first repository
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] shadow-2xl transform transition-all border border-neutral-200 my-auto flex flex-col">
            {/* Header - Fixed */}
            <div className="flex justify-between items-start mb-4 sm:mb-6 flex-shrink-0">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Upload Repository
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1">AI will analyze and document your code</p>
              </div>
              <button
                onClick={() => { setShowUploadModal(false); setCreditError(null); }}
                className="text-neutral-400 hover:text-neutral-600 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-neutral-100 rounded-xl transition duration-200 flex-shrink-0 min-h-[44px] min-w-[44px]"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-4 sm:mb-6 bg-neutral-100 p-1 rounded-xl flex-shrink-0">
              <button
                onClick={() => setUploadTab('files')}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                  uploadTab === 'files'
                    ? 'bg-white text-primary-600 shadow-md'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <CloudArrowUpIcon className="w-4 h-4" />
                <span>Upload Files</span>
              </button>
              <button
                onClick={() => setUploadTab('github')}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                  uploadTab === 'github'
                    ? 'bg-white text-primary-600 shadow-md'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub URL</span>
              </button>
            </div>

            {creditError && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start justify-between gap-3">
                <p className="text-sm text-amber-800">{creditError}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to="/settings"
                    className="text-xs font-semibold text-amber-800 hover:underline"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Manage credits
                  </Link>
                  <button
                    type="button"
                    onClick={() => setCreditError(null)}
                    className="text-xs font-semibold uppercase tracking-wide text-amber-700 hover:text-amber-900"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pr-1 -mr-1">
              {/* Files Tab */}
              {uploadTab === 'files' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">
                      Repository Name
                    </label>
                    <input
                      type="text"
                      value={repositoryName}
                      onChange={(e) => setRepositoryName(e.target.value)}
                      placeholder="My Awesome Project"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200 outline-none font-medium text-sm sm:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">
                      Code Files
                    </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="mb-3 sm:mb-4 animate-float flex justify-center items-center">
                    <FolderIcon className="w-16 h-16 sm:w-20 sm:h-20 text-blue-500" />
                  </div>
                  <p className="text-neutral-900 font-semibold text-base sm:text-lg mb-1 sm:mb-2">
                    {isDragActive ? 'Drop files here...' : 'Drag & drop code files'}
                  </p>
                  <p className="text-neutral-600 text-xs sm:text-sm mb-2 sm:mb-3">
                    or click to browse your computer
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-3 sm:mt-4">
                    {['Python', 'JavaScript', 'TypeScript', 'Java', 'C/C++', 'Go', 'Rust'].map(lang => (
                      <span key={lang} className="px-2 sm:px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-lg">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-4 max-h-40 sm:max-h-48 overflow-y-auto space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 sm:p-3 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-primary-300 transition duration-200"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">{file.name}</p>
                            <p className="text-xs text-neutral-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg p-1.5 sm:p-2 transition duration-200 flex-shrink-0"
                          aria-label="Remove file"
                        >
                          <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                  </div>
                </>
              )}

              {/* GitHub Tab */}
              {uploadTab === 'github' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">
                      GitHub Repository URL
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username/repository"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200 outline-none font-medium text-sm sm:text-base"
                    />
                    <p className="mt-2 text-xs text-neutral-600">
                      Paste any public GitHub repository URL to analyze and document
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">
                      Maximum Files to Process
                    </label>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <input
                        type="range"
                        min="10"
                        max="200"
                        step="10"
                        value={maxFiles}
                        onChange={(e) => setMaxFiles(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="10"
                          max="200"
                          value={maxFiles}
                          onChange={(e) => setMaxFiles(Math.min(200, Math.max(10, parseInt(e.target.value) || 10)))}
                          className="w-16 sm:w-20 px-2 sm:px-3 py-1.5 sm:py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-center font-bold text-neutral-900 focus:ring-2 focus:ring-primary-500 outline-none text-sm sm:text-base"
                        />
                        <span className="text-xs sm:text-sm text-neutral-600 font-medium">files</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-neutral-600">
                      Limit the number of files to control processing time and AI costs
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs sm:text-sm">
                        <p className="font-semibold text-primary-900 mb-1">How it works:</p>
                        <ul className="text-primary-800 space-y-1 list-disc list-inside">
                          <li>Repository will be cloned (shallow clone)</li>
                          <li>Code files will be extracted automatically</li>
                          <li>AI will document all supported files</li>
                          <li>Supported: Python, JavaScript, TypeScript, Java, C/C++, Go, Rust</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Prompt Template Selector */}
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2 sm:mb-3 flex items-center space-x-2">
                  <PencilSquareIcon className="w-4 h-4" />
                  <span>Documentation Style</span>
                </label>
                <div className="bg-neutral-50 rounded-xl p-3 sm:p-4 border border-neutral-200">
                  <PromptTemplateSelector
                    selectedTemplateId={selectedPromptTemplate}
                    onTemplateSelect={setSelectedPromptTemplate}
                    language={uploadTab === 'files' ? undefined : 'auto'}
                  />
                </div>
                <p className="mt-2 text-xs text-neutral-600">
                  Choose how you want your code documented. Different styles for different audiences.
                </p>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="flex-shrink-0 pt-4 sm:pt-6 border-t border-neutral-200 mt-4 sm:mt-6">
              <div className="flex space-x-2 sm:space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-neutral-300 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-50 transition duration-200 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={
                    (uploadTab === 'files' && (!repositoryName.trim() || selectedFiles.length === 0 || uploadMutation.isPending)) ||
                    (uploadTab === 'github' && (!githubUrl.trim() || githubMutation.isPending))
                  }
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  {(uploadMutation.isPending || githubMutation.isPending) ? (
                    <span className="flex items-center justify-center">
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      {uploadTab === 'github' ? 'Cloning Repository...' : 'Uploading...'}
                    </span>
                  ) : uploadTab === 'files' ? (
                    `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'file' : 'files'}`
                  ) : (
                    'Clone & Process Repository'
                  )}
                </button>
              </div>

              {(uploadMutation.isError || githubMutation.isError) && (
                <div className="mt-4 p-3 sm:p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-center space-x-3">
                  <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-danger-600 flex-shrink-0" />
                  <p className="text-danger-700 text-xs sm:text-sm font-medium">
                    {getUserFriendlyError(
                      uploadMutation.error || githubMutation.error,
                      uploadTab === 'files' ? ErrorContexts.upload : ErrorContexts.github
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (() => {
        const repoToDelete = filteredRepositories?.find((r) => r.id === deleteConfirmId);
        const isProcessing = repoToDelete?.status === 'processing';
        return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all border border-neutral-200">
            <div className="text-center mb-6">
              <div className="mx-auto w-20 h-20 bg-danger-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">Delete Repository?</h3>
              <p className="text-neutral-600 leading-relaxed">
                This will permanently delete the repository and all its documentation.
                <br />
                <span className="font-semibold text-danger-600">This action cannot be undone.</span>
              </p>
              {isProcessing && (
                <p className="text-sm text-amber-700 mt-3">
                  This will stop any ongoing processing and remove the repository.
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-3 border-2 border-neutral-300 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-50 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-3 bg-danger-600 text-white font-semibold rounded-xl hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg"
              >
                {deleteMutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Deleting...
                  </span>
                ) : (
                  'Delete Permanently'
                )}
              </button>
            </div>

            {deleteMutation.isError && (
              <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-xl">
                <p className="text-danger-700 text-sm text-center font-medium">
                  {getUserFriendlyError(deleteMutation.error, { operation: 'delete repository', resource: 'Repository' })}
                </p>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* AI Chat Component */}
      <div data-tour="chat-button">
        <BentoChat />
      </div>

      {/* Onboarding Tour */}
      <OnboardingTour isOpen={showTour} onComplete={completeTour} />
    </div>
  );
}
