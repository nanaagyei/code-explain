import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import BentoChat from '../components/BentoChat';
import { PromptTemplateSelector } from '../components/PromptTemplateSelector';
import BulkUploadModal from '../components/BulkUploadModal';
import type { Repository } from '../types/index';
import { 
  FolderIcon, 
  DocumentTextIcon, 
  BriefcaseIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  CloudArrowUpIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  BoltIcon,
  UserCircleIcon,
  BookOpenIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { 
  FolderIcon as FolderSolidIcon,
  DocumentTextIcon as DocumentSolidIcon,
  CheckCircleIcon as CheckSolidIcon,
  BoltIcon as BoltSolidIcon
} from '@heroicons/react/24/solid';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [repositoryName, setRepositoryName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [uploadTab, setUploadTab] = useState<'files' | 'github'>('files');
  const [githubUrl, setGithubUrl] = useState('');
  const [maxFiles, setMaxFiles] = useState(100);
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<number | null>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

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
    <div className="min-h-screen bg-white">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg sm:text-xl font-bold">C</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    CodeXplain
                  </h1>
                  <p className="text-xs text-gray-500 font-medium hidden sm:block">AI-Powered Documentation</p>
                </div>
              </div>
              <span className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                GPT-4
              </span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <a
                href="https://code-explain-production.up.railway.app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition duration-200 flex items-center space-x-1"
              >
                <BookOpenIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Docs</span>
              </a>
              <Link
                to="/batch-jobs"
                className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition duration-200 flex items-center space-x-1"
              >
                <BriefcaseIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Batch Jobs</span>
              </Link>
              <Link
                to="/settings"
                className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition duration-200 flex items-center space-x-1"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
              <Link
                to="/mentor"
                className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition duration-200 flex items-center space-x-1"
              >
                <AcademicCapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">AI Mentor</span>
              </Link>
              
              {/* User Menu Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition duration-200 border border-gray-200 cursor-pointer"
                >
                  <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 rounded-full flex-shrink-0">
                    <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="hidden sm:block text-left min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-[150px]">
                      {user?.username || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[150px]">
                      {user?.email || ''}
                    </p>
                  </div>
                  {/* Mobile: Show only icon and username */}
                  <div className="sm:hidden text-left min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate max-w-[80px]">
                      {user?.username || 'User'}
                    </p>
                  </div>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.username || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {user?.email || ''}
                      </p>
                    </div>
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition duration-200"
                    >
                      <Cog6ToothIcon className="w-5 h-5 text-gray-500" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-neutral-200/50 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Total Repositories</p>
                <p className="text-2xl sm:text-4xl font-bold text-blue-600">
                  {stats.total}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <FolderSolidIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-neutral-200/50 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Completed</p>
                <p className="text-2xl sm:text-4xl font-bold text-green-600">
                  {stats.completed}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckSolidIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-neutral-200/50 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Processing</p>
                <p className="text-2xl sm:text-4xl font-bold text-orange-600">
                  {stats.processing}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                <BoltSolidIcon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-neutral-200/50 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Files Documented</p>
                <p className="text-2xl sm:text-4xl font-bold text-purple-600">
                  {stats.totalFiles}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <DocumentSolidIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar with Search & Filter */}
        <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200/50 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 md:max-w-md">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200 outline-none"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition duration-200 outline-none text-sm font-medium text-neutral-700"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowBulkUploadModal(true)}
                  className="px-4 sm:px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition duration-200 shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Bulk Upload</span>
                </button>
                
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 sm:px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition duration-200 shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Repository</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Repositories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-neutral-200/50 animate-pulse">
                <div className="h-6 bg-neutral-200 rounded-lg w-3/4 mb-4"></div>
                <div className="h-4 bg-neutral-200 rounded-lg w-1/2 mb-3"></div>
                <div className="h-4 bg-neutral-200 rounded-lg w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredRepositories && filteredRepositories.length > 0 ? (
          <>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-neutral-900">
                {searchQuery || filterStatus !== 'all' 
                  ? `Found ${filteredRepositories.length} ${filteredRepositories.length === 1 ? 'repository' : 'repositories'}`
                  : 'Your Repositories'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredRepositories.map((repo: Repository) => (
                <div
                  key={repo.id}
                  className="group bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-neutral-200/50 hover:border-primary-300 transform hover:-translate-y-1 relative overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-accent-500/0 group-hover:from-primary-500/5 group-hover:to-accent-500/5 transition-all duration-300 rounded-2xl"></div>
                  
                  <Link to={`/repositories/${repo.id}`} className="block relative z-0">
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition duration-200 break-words flex-1 min-w-0">
                        {repo.name}
                      </h4>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <span className={`px-2 sm:px-3 py-1 text-xs font-bold rounded-full border backdrop-blur-sm flex items-center space-x-1 whitespace-nowrap ${getStatusColor(repo.status)}`}>
                          {getStatusIcon(repo.status)}
                          <span className="hidden sm:inline">{repo.status}</span>
                          <span className="sm:hidden">{repo.status.charAt(0).toUpperCase()}</span>
                        </span>
                        {/* Delete button positioned beside the status tag */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirmId(repo.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-1.5"
                          title="Delete repository"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600 font-medium">Files</span>
                        <span className="text-sm font-bold text-neutral-900">{repo.total_files}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600 font-medium">Processed</span>
                        <span className="text-sm font-bold text-neutral-900">{repo.processed_files}</span>
                      </div>
                      
                      {repo.status === 'processing' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-neutral-600 mb-1">
                            <span>Progress</span>
                            <span className="font-semibold">{Math.round((repo.processed_files / repo.total_files) * 100)}%</span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 h-2 rounded-full transition-all duration-500 animate-gradient-x"
                              style={{ width: `${(repo.processed_files / repo.total_files) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-neutral-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">
                          {new Date(repo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-primary-600 font-medium group-hover:text-accent-600 transition duration-200">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 sm:py-16 lg:py-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-dashed border-neutral-300 px-4">
            <div className="mb-4 sm:mb-6 animate-float flex justify-center">
              <FolderIcon className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 text-gray-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2 sm:mb-3">
              {searchQuery || filterStatus !== 'all' ? 'No matches found' : 'No repositories yet'}
            </h3>
            <p className="text-sm sm:text-base text-neutral-600 mb-6 sm:mb-8 max-w-md mx-auto">
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start by uploading your first code repository and let AI generate comprehensive documentation'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm sm:text-base font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center space-x-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload Your First Repository</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] shadow-2xl transform transition-all border border-neutral-200 my-auto flex flex-col">
            {/* Header - Fixed */}
            <div className="flex justify-between items-start mb-4 sm:mb-6 flex-shrink-0">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Upload Repository
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1">AI will analyze and document your code</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-2xl sm:text-3xl leading-none w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-neutral-100 rounded-xl transition duration-200 flex-shrink-0"
                aria-label="Close modal"
              >
                ×
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
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
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
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
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

                  <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-3 sm:p-4 rounded-xl border border-primary-100">
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
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
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
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
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-danger-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-danger-700 text-xs sm:text-sm font-medium">
                    {(uploadMutation.error as Error)?.message || 
                     (githubMutation.error as Error)?.message || 
                     'Operation failed'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
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
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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
                  Failed to delete repository
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
      />

      {/* AI Chat Component */}
      <BentoChat />
    </div>
  );
}
