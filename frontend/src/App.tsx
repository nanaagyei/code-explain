import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { apiClient } from './api/client';

// Pages (we'll create these)
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import RepositoryDetail from './pages/RepositoryDetail';
import FileDocumentation from './pages/FileDocumentation';
import Settings from './pages/Settings';
import BatchJobs from './pages/BatchJobs';
import MentorDashboard from './pages/MentorDashboard';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Document title management
function DocumentTitleManager() {
  const location = useLocation();
  
  useEffect(() => {
    const getPageTitle = (pathname: string) => {
      switch (pathname) {
        case '/':
          return 'Dashboard - CodeExplain';
        case '/login':
          return 'Sign In - CodeExplain';
        case '/register':
          return 'Sign Up - CodeExplain';
        case '/settings':
          return 'Settings - CodeExplain';
        case '/batch-jobs':
          return 'Batch Jobs - CodeExplain';
        case '/mentor':
          return 'AI Mentor - CodeExplain';
        default:
          if (pathname.startsWith('/repositories/')) {
            if (pathname.includes('/files/')) {
              return 'File Documentation - CodeExplain';
            }
            return 'Repository Details - CodeExplain';
          }
          return 'CodeExplain - AI-Powered Code Documentation';
      }
    };
    
    const title = getPageTitle(location.pathname);
    document.title = title;
    
    // Update meta description based on page
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      const descriptions: Record<string, string> = {
        '/': 'Manage your code repositories and generate AI-powered documentation. Upload files or connect GitHub repositories for automated code analysis.',
        '/login': 'Sign in to CodeExplain and start generating comprehensive documentation for your code projects.',
        '/register': 'Join CodeExplain to transform your code into comprehensive documentation with AI-powered insights.',
        '/settings': 'Configure your CodeExplain account settings, API keys, and documentation preferences.',
        '/batch-jobs': 'Monitor and manage your batch documentation jobs. Track progress and view results.',
        '/mentor': 'Get personalized coding insights and learning recommendations from our AI mentor.',
      };
      
      const description = descriptions[location.pathname] || 
        'Transform your code into comprehensive documentation with AI. Get personalized coding insights, learning paths, and automated documentation.';
      
      metaDescription.setAttribute('content', description);
    }
  }, [location.pathname]);
  
  return null;
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const { setUser, setLoading } = useAuthStore();
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const user = await apiClient.getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('access_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [setUser, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <DocumentTitleManager />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/repositories/:id"
            element={
              <ProtectedRoute>
                <RepositoryDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/repositories/:repositoryId/files/:fileId"
            element={
              <ProtectedRoute>
                <FileDocumentation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/batch-jobs"
            element={
              <ProtectedRoute>
                <BatchJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentor"
            element={
              <ProtectedRoute>
                <MentorDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;