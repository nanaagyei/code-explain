import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { CodeFile, WebSocketMessage } from '../types/index';
import { 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Clock, 
  FolderOpen,
  ClipboardList,
  AlertCircle
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
      // Keep refetching while processing
      const status = query.state.data?.repository.status;
      return status === 'processing' ? 3000 : false;
    },
  });

  const repository = data?.repository;
  const files = data?.files || [];

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading repository...</p>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <AlertCircle className="w-16 h-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Repository not found</h2>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 transition duration-200 text-sm sm:text-base"
            >
              ← Back
            </Link>
            <div className="flex items-center flex-wrap gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{repository.name}</h1>
              <span className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                repository.status === 'completed' ? 'bg-green-100 text-green-800' :
                repository.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                repository.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {repository.status}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Card */}
        {repository.status === 'processing' && (
          <div className="mb-6 bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Zap className="w-5 h-5 animate-pulse" />
                <span>Processing Documentation...</span>
              </h3>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(progress)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 animate-gradient-x"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className="mt-4 flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-600">
                {wsConnected ? 'Live updates active' : 'Connecting...'}
              </span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-blue-100 text-sm font-medium mb-1">Total Files</p>
            <p className="text-4xl font-bold">{repository.total_files}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-green-100 text-sm font-medium mb-1">Processed</p>
            <p className="text-4xl font-bold">{repository.processed_files}</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <p className="text-purple-100 text-sm font-medium mb-1">Completion</p>
            <p className="text-4xl font-bold">
              {repository.total_files > 0
                ? Math.round((repository.processed_files / repository.total_files) * 100)
                : 0}%
            </p>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <FolderOpen className="w-6 h-6" />
            <span>Files ({files.length})</span>
          </h3>
          
          <div className="space-y-3">
            {files.map((file: CodeFile) => (
              <Link
                key={file.id}
                to={file.status === 'completed' ? `/repositories/${repository.id}/files/${file.id}` : '#'}
                className={`block p-4 border-2 rounded-xl transition-all duration-200 ${
                  file.status === 'completed'
                    ? 'border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                    : 'border-gray-100 cursor-default'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-600">{getFileIcon(file.status)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{file.file_path}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                          {file.language}
                        </span>
                        {file.complexity_score !== null && (
                          <span className={`text-xs px-2 py-1 rounded ${
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
                  <span className={`text-sm font-medium ${getFileStatusColor(file.status)}`}>
                    {file.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Processing Logs */}
        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-2xl shadow-xl p-6 overflow-hidden">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ClipboardList className="w-5 h-5 mr-2" />
              <span>Processing Logs</span>
            </h3>
            <div className="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {logs.map((log, idx) => (
                <div key={idx} className="text-gray-300 mb-1 hover:bg-gray-800/50 px-2 py-1 rounded transition duration-150">
                  <span className="text-gray-500 mr-2">
                    [{new Date().toLocaleTimeString()}]
                  </span>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
