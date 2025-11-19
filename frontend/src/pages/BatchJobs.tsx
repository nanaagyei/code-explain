import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { BatchJobSummary } from '../types/index';
import { useState, useRef, useEffect } from 'react';
import { 
  Package, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  HelpCircle, 
  Folder,
  Clock,
  ClipboardList,
  UserCircle,
  LogOut,
  ChevronDown
} from 'lucide-react';

export default function BatchJobs() {
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
  const queryClient = useQueryClient();

  // Fetch batch jobs
  const { data: batchJobs, isLoading } = useQuery({
    queryKey: ['batch-jobs'],
    queryFn: () => apiClient.getBatchJobs(),
    refetchInterval: 3000, // Refetch every 3 seconds to get live updates
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['batch-job-stats'],
    queryFn: () => apiClient.getBatchJobStats(),
    refetchInterval: 5000,
  });

  // Cancel batch job mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => apiClient.cancelBatchJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
    },
  });

  // Delete batch job mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteBatchJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 inline" />;
      case 'processing': return <Settings className="w-4 h-4 inline animate-spin" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 inline" />;
      case 'failed': return <XCircle className="w-4 h-4 inline" />;
      case 'cancelled': return <Ban className="w-4 h-4 inline" />;
      default: return <HelpCircle className="w-4 h-4 inline" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition duration-200 text-sm sm:text-base"
              >
                ← Back
              </Link>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg sm:text-xl font-bold">C</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Batch Jobs</h1>
                  <p className="text-xs text-gray-500 font-medium hidden sm:block">Track bulk repository processing</p>
                </div>
              </div>
            </div>
            
            {/* User Menu Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition duration-200 border border-gray-200 cursor-pointer"
              >
                <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 rounded-full flex-shrink-0">
                  <UserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="hidden md:block text-left min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-[150px]">
                    {user?.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[150px]">
                    {user?.email || ''}
                  </p>
                </div>
                {/* Mobile: Show only icon and username */}
                <div className="md:hidden text-left min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate max-w-[80px]">
                    {user?.username || 'User'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-100 md:hidden">
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
                    <SettingsIcon className="w-5 h-5 text-gray-500" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium mb-1">Total Jobs</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.total_jobs}</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium mb-1">Processing</p>
                  <p className="text-3xl font-bold text-green-900">{stats.processing_jobs}</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium mb-1">Completed</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.completed_jobs}</p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium mb-1">Repositories</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.total_repositories}</p>
                </div>
                <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                  <Folder className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Jobs List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <ClipboardList className="w-6 h-6" />
            <span>Batch Jobs</span>
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded-lg w-1/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-1/3"></div>
                </div>
              ))}
            </div>
          ) : batchJobs && batchJobs.length > 0 ? (
            <div className="space-y-4">
              {batchJobs.map((job: BatchJobSummary) => (
                <div
                  key={job.id}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{job.name}</h3>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center space-x-1 ${getStatusColor(job.status)}`}>
                          {getStatusIcon(job.status)}
                          <span>{job.status.toUpperCase()}</span>
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progress</span>
                          <span>{Math.round(job.progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <span className="flex items-center space-x-1"><Package className="w-4 h-4" /><span>{job.total_items} items</span></span>
                        <span className="flex items-center space-x-1"><CheckCircle2 className="w-4 h-4" /><span>{job.completed_items} completed</span></span>
                        {job.failed_items > 0 && (
                          <span className="text-red-600 flex items-center space-x-1"><XCircle className="w-4 h-4" /><span>{job.failed_items} failed</span></span>
                        )}
                        <span className="flex items-center space-x-1"><Clock className="w-4 h-4" /><span>{new Date(job.created_at).toLocaleDateString()}</span></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        to={`/batch-jobs/${job.id}`}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition duration-200"
                      >
                        View Details
                      </Link>
                      
                      {job.status === 'processing' && (
                        <button
                          onClick={() => cancelMutation.mutate(job.id)}
                          disabled={cancelMutation.isPending}
                          className="px-4 py-2 text-sm font-medium text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition duration-200"
                        >
                          Cancel
                        </button>
                      )}
                      
                      {['completed', 'failed', 'cancelled'].includes(job.status) && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this batch job?')) {
                              deleteMutation.mutate(job.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition duration-200"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mb-4 flex justify-center">
                <Package className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">No batch jobs yet</h3>
              <p className="text-gray-600 mb-6">
                Create a batch job to process multiple repositories at once.
              </p>
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition duration-200 shadow-lg inline-block"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
