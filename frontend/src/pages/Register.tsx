import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login: loginToStore } = useAuthStore();

  const registerMutation = useMutation({
    mutationFn: async ({ username, email, password }: { username: string; email: string; password: string }) => {
      const registerResponse = await apiClient.register(username, email, password);
      // Auto-login after registration
      const loginResponse = await apiClient.login(username, password);
      return { register: registerResponse, login: loginResponse };
    },
    onSuccess: (data) => {
      loginToStore(data.login.user, data.login.access_token);
      navigate('/dashboard');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && email && password) {
      registerMutation.mutate({ username, email, password });
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Feature Showcase with Animated Orbs */}
      <div className="hidden lg:flex lg:flex-1 bg-gray-100 relative overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large Blue Orb - Bottom Right */}
          <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-500 rounded-full opacity-40 blur-3xl animate-float-slow"></div>
          
          {/* Medium Blue Orb - Top Left */}
          <div className="absolute top-[-15%] left-[-10%] w-80 h-80 bg-electric-400 rounded-full opacity-30 blur-3xl animate-float-slower"></div>
          
          {/* Small Accent Orb - Center */}
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-600 rounded-full opacity-25 blur-2xl animate-float"></div>
          
          {/* Extra Glow Effect */}
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-white rounded-full opacity-15 blur-3xl animate-pulse-slow"></div>
          
          {/* Additional Orb for More Movement */}
          <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-electric-300 rounded-full opacity-20 blur-2xl animate-float"></div>
        </div>

        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-gray-900">
          <div className="max-w-md">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-8 shadow-glow">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              Start Documenting Your Code
            </h2>
            
            <p className="text-lg text-gray-700 mb-8">
              Join developers using AI to create better documentation. 
              Free to start, upgrade as you grow.
            </p>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Multi-Language Support</h3>
                  <p className="text-sm text-gray-700">Python, JavaScript, TypeScript, Java, C/C++, Go, Rust</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Real-time Processing</h3>
                  <p className="text-sm text-gray-700">Watch your documentation generate in real-time</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Export & Share</h3>
                  <p className="text-sm text-gray-700">Download as Markdown, JSON, or plain text</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gray-950 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">C</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-950">CodeExplain</h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-950 mb-2">Create your account</h2>
            <p className="text-gray-600">Start generating AI-powered documentation</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-900 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-950 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                placeholder="At least 8 characters"
              />
              <p className="mt-2 text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            {registerMutation.isError && (
              <div className="p-4 bg-danger-light border border-danger rounded-lg">
                <p className="text-danger-dark text-sm font-medium">
                  {(registerMutation.error as Error)?.message || 'Registration failed'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full px-4 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-600 font-semibold">
                Sign in
              </Link>
            </p>
          </div>

          {/* Terms */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to CodeExplain's{' '}
              <a href="#" className="underline hover:text-gray-700">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="underline hover:text-gray-700">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
