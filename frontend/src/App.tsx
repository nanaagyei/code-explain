import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { apiClient } from './api/client';

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import RepositoryDetail from './pages/RepositoryDetail';
import FileDocumentation from './pages/FileDocumentation';
import Settings from './pages/Settings';
import Compare from './pages/Compare';
import { AppLayout } from './components/AppLayout';

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
        case '/dashboard':
          return 'Dashboard - CodeXplain';
        case '/login':
          return 'Sign In - CodeXplain';
        case '/register':
          return 'Sign Up - CodeXplain';
        case '/settings':
          return 'Settings - CodeXplain';
        case '/compare':
          return 'Compare Repositories - CodeXplain';
        default:
          if (pathname.startsWith('/repositories/')) {
            if (pathname.includes('/files/')) {
              return 'File Documentation - CodeXplain';
            }
            return 'Repository Details - CodeXplain';
          }
          return 'CodeXplain - AI-Powered Code Documentation';
      }
    };
    
    const title = getPageTitle(location.pathname);
    document.title = title;
    
    // Update meta description based on page
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      const descriptions: Record<string, string> = {
        '/': 'Manage your code repositories and generate AI-powered documentation. Upload files or connect GitHub repositories for automated code analysis.',
        '/dashboard': 'Manage your code repositories and generate AI-powered documentation. Upload files or connect GitHub repositories for automated code analysis.',
        '/login': 'Sign in to CodeXplain and start generating comprehensive documentation for your code projects.',
        '/register': 'Join CodeXplain to transform your code into comprehensive documentation with AI-powered insights.',
        '/settings': 'Configure your CodeXplain account settings, API keys, and documentation preferences.',
        '/compare': 'Compare two repositories and analyze differences, architecture, and complexity.',
      };
      
      const description = descriptions[location.pathname] ||
        'Transform your code into clear, structured documentation with AI-powered insights.';
      
      metaDescription.setAttribute('content', description);
    }
  }, [location.pathname]);
  
  return null;
}

// Protected Route wrapper (layout route: renders Outlet)
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-center font-body">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-primary-500" />
          <p className="mt-4 text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}

function App() {
  const { user, setUser, setLoading } = useAuthStore();
  
  // Check authentication on mount only (runs once)
  useEffect(() => {
    const AUTH_CHECK_TIMEOUT_MS = 8000;

    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');

      if (user) {
        setLoading(false);
        return;
      }

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), AUTH_CHECK_TIMEOUT_MS)
        );
        const fetchedUser = await Promise.race([
          apiClient.getCurrentUser(),
          timeoutPromise,
        ]);
        setUser(fetchedUser);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('access_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <DocumentTitleManager />
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          
          <Route path="/" element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="compare" element={<Compare />} />
              <Route path="settings" element={<Settings />} />
              <Route path="repositories/:id" element={<RepositoryDetail />} />
              <Route path="repositories/:repositoryId/files/:fileId" element={<FileDocumentation />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;