import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import type { FunctionDocumentation, ClassDocumentation } from '../types/index';
import { 
  MagnifyingGlassIcon, 
  ChartBarIcon, 
  ShareIcon, 
  DocumentTextIcon,
  CodeBracketIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { DocumentTextIcon as DocumentSolidIcon } from '@heroicons/react/24/solid';
import CodeReviewComponent from '../components/CodeReview';
import QualityMetricsComponent from '../components/QualityMetrics';
import ArchitectureDiagramComponent from '../components/ArchitectureDiagram';
import MentorHint from '../components/MentorHint';

export default function FileDocumentation() {
  const { repositoryId, fileId } = useParams<{ repositoryId: string; fileId: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'functions' | 'classes' | 'code' | 'review' | 'quality' | 'architecture'>('overview');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'markdown' | 'json' | 'txt') => {
    if (!repositoryId || !fileId) return;
    
    setIsExporting(true);
    try {
      const blob = await apiClient.exportDocumentation(parseInt(repositoryId), parseInt(fileId), format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documentation_${fileId}.${format === 'markdown' ? 'md' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export documentation');
    } finally {
      setIsExporting(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['fileDocumentation', repositoryId, fileId],
    queryFn: () => apiClient.getFileDocumentation(parseInt(repositoryId!), parseInt(fileId!)),
    enabled: !!repositoryId && !!fileId,
  });

  useEffect(() => {
    if (data && activeTab === 'code') {
      Prism.highlightAll();
    }
  }, [data, activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-accent-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-4 text-neutral-700 font-semibold">Loading documentation...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-accent-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 animate-float flex justify-center">
            <DocumentSolidIcon className="w-32 h-32 text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-3">Documentation not found</h2>
          <Link 
            to={`/repositories/${repositoryId}`} 
            className="text-primary-600 hover:text-accent-600 font-semibold transition"
          >
            ← Back to repository
          </Link>
        </div>
      </div>
    );
  }

  const doc = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-accent-50/20">
      {/* Modern Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-neutral-200/50 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            {/* Breadcrumb & Title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 text-sm mb-2">
                <Link to="/dashboard" className="text-neutral-500 hover:text-primary-600 transition">
                  Dashboard
                </Link>
                <span className="text-neutral-400">/</span>
                <Link to={`/repositories/${repositoryId}`} className="text-neutral-500 hover:text-primary-600 transition truncate">
                  Repository
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {doc.file_path}
              </h1>
            </div>

            {/* Badges & Actions */}
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 border border-blue-200">
                  {doc.language}
                </span>
                <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-700 border border-purple-200">
                  Complexity: {doc.complexity}
                </span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700 border border-green-200">
                  {doc.stats.total_lines} lines
                </span>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center space-x-2 border-l border-neutral-200 pl-3">
                <button
                  onClick={() => handleExport('markdown')}
                  disabled={isExporting}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition duration-200 shadow-md hover:shadow-xl flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export</span>
                </button>
                
                <div className="relative group">
                  <button className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-neutral-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="py-2">
                      <button
                        onClick={() => handleExport('json')}
                        disabled={isExporting}
                        className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 flex items-center space-x-2"
                      >
                        <CodeBracketIcon className="w-4 h-4" />
                        <span>Export as JSON</span>
                      </button>
                      <button
                        onClick={() => handleExport('txt')}
                        disabled={isExporting}
                        className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 flex items-center space-x-2"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        <span>Export as Text</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="mt-6 border-b border-neutral-200">
            <ul className="flex space-x-8 overflow-x-auto">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'functions', label: 'Functions' },
                { key: 'classes', label: 'Classes' },
                { key: 'code', label: 'Code' },
                { key: 'review', label: 'Code Review' },
                { key: 'quality', label: 'Quality Score' },
                { key: 'architecture', label: 'Architecture' }
              ].map((tab) => (
                <li key={tab.key}>
                  <button
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`py-3 px-1 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                      activeTab === tab.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    {tab.key === 'functions' && doc.functions.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {doc.functions.length}
                      </span>
                    )}
                    {tab.key === 'classes' && doc.classes.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                        {doc.classes.length}
                      </span>
                    )}
                    {tab.key === 'review' && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs flex items-center">
                        <MagnifyingGlassIcon className="w-3 h-3" />
                      </span>
                    )}
                    {tab.key === 'quality' && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs flex items-center">
                        <ChartBarIcon className="w-3 h-3" />
                      </span>
                    )}
                    {tab.key === 'architecture' && (
                      <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center">
                        <ShareIcon className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Summary Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-neutral-200/50">
              <h2 className="text-3xl font-bold text-neutral-900 mb-6 flex items-center">
                <PencilSquareIcon className="w-10 h-10 text-blue-600 mr-4" />
                File Summary
              </h2>
              <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-6 rounded-xl border border-primary-100">
                <div className="prose prose-primary max-w-none text-neutral-700 leading-relaxed">
                  <ReactMarkdown>{doc.summary}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-neutral-200/50 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-600 text-sm font-medium mb-1">Total Lines</p>
                    <p className="text-4xl font-bold text-neutral-900">{doc.stats.total_lines}</p>
                  </div>
                  <DocumentSolidIcon className="w-10 h-10 text-primary-400" />
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-neutral-200/50 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-600 text-sm font-medium mb-1">Non-Empty Lines</p>
                    <p className="text-4xl font-bold text-neutral-900">{doc.stats.non_empty_lines}</p>
                  </div>
                  <svg className="w-10 h-10 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-neutral-200/50 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-600 text-sm font-medium mb-1">Complexity</p>
                    <p className="text-4xl font-bold text-neutral-900">{doc.complexity}</p>
                  </div>
                  <svg className="w-10 h-10 text-danger-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-neutral-200/50 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-neutral-600 text-sm font-medium mb-1">AST Depth</p>
                    <p className="text-4xl font-bold text-neutral-900">{doc.stats.max_depth}</p>
                  </div>
                  <ShareIcon className="w-10 h-10 text-accent-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'functions' && (
          <div className="space-y-6 animate-fade-in">
            {doc.functions.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center text-neutral-600 border border-neutral-200/50">
                <div className="mb-4 flex justify-center">
                  <WrenchScrewdriverIcon className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-lg font-medium">No functions found in this file</p>
              </div>
            ) : (
              doc.functions.map((func: FunctionDocumentation, index: number) => (
                <div key={index} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-neutral-200/50 hover:shadow-2xl transition-shadow duration-300">
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-2xl font-semibold text-primary-700 flex items-center">
                      <CodeBracketIcon className="w-8 h-8 text-primary-600 mr-3" />
                      <code className="font-mono">{func.name}</code>
                    </h3>
                    <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full font-medium">
                      Lines {func.start_line}–{func.end_line}
                    </span>
                  </div>

                  {func.params.length > 0 && (
                    <div className="mb-4">
                      <span className="text-md font-semibold text-neutral-700">Parameters: </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {func.params.map((param: string, pIdx: number) => (
                          <code key={pIdx} className="text-sm bg-primary-100 text-primary-800 px-3 py-1 rounded-full font-mono font-semibold">
                            {param}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg border border-primary-100">
                    <div className="prose prose-primary max-w-none text-neutral-700 text-sm leading-relaxed">
                      <ReactMarkdown>{func.documentation}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-6 animate-fade-in">
            {doc.classes.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center text-neutral-600 border border-neutral-200/50">
                <div className="mb-4 flex justify-center">
                  <CubeIcon className="w-24 h-24 text-gray-400" />
                </div>
                <p className="text-lg font-medium">No classes found in this file</p>
              </div>
            ) : (
              doc.classes.map((cls: ClassDocumentation, index: number) => (
                <div key={index} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-neutral-200/50 hover:shadow-2xl transition-shadow duration-300">
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-2xl font-semibold text-accent-700 flex items-center">
                      <CubeIcon className="w-8 h-8 text-accent-600 mr-3" />
                      <code className="font-mono">{cls.name}</code>
                    </h3>
                    <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full font-medium">
                      Lines {cls.start_line}–{cls.end_line}
                    </span>
                  </div>

                  {cls.methods.length > 0 && (
                    <div className="mb-4">
                      <span className="text-md font-semibold text-neutral-700">Methods: </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {cls.methods.map((method: string, mIdx: number) => (
                          <code key={mIdx} className="text-sm bg-accent-100 text-accent-800 px-3 py-1 rounded-full font-mono font-semibold">
                            {method}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-gradient-to-r from-accent-50 to-primary-50 rounded-lg border border-accent-100">
                    <div className="prose prose-accent max-w-none text-neutral-700 text-sm leading-relaxed">
                      <ReactMarkdown>{cls.documentation}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-200/50 overflow-hidden animate-fade-in">
            <div className="p-6 bg-gradient-to-r from-primary-50 to-accent-50 border-b border-neutral-200">
              <h2 className="text-2xl font-bold text-neutral-900 flex items-center">
                <CodeBracketIcon className="w-8 h-8 text-primary-600 mr-4" />
                Source Code
              </h2>
            </div>
            <div className="relative">
              <pre className="!mt-0 !rounded-t-none !bg-neutral-900">
                <code className={`language-${doc.language}`}>
                  {doc.documented_code}
                </code>
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'review' && repositoryId && fileId && (
          <CodeReviewComponent 
            repositoryId={parseInt(repositoryId)} 
            fileId={parseInt(fileId)} 
          />
        )}

        {activeTab === 'quality' && repositoryId && fileId && (
          <QualityMetricsComponent 
            repositoryId={parseInt(repositoryId)} 
            fileId={parseInt(fileId)} 
          />
        )}

        {activeTab === 'architecture' && repositoryId && fileId && (
          <ArchitectureDiagramComponent 
            repositoryId={parseInt(repositoryId)} 
            fileId={parseInt(fileId)} 
          />
        )}
      </main>

      {/* Mentor Hint Component */}
      {repositoryId && fileId && (
        <MentorHint 
          repositoryId={parseInt(repositoryId)} 
          fileId={parseInt(fileId)}
          className="animate-fade-in"
        />
      )}
    </div>
  );
}
