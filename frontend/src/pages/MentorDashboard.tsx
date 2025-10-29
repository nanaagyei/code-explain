import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { MentorInsight, LearningPathItem, Challenge, CodeFile } from '../types/index';
import { 
  AcademicCapIcon,
  LightBulbIcon,
  FlagIcon,
  BookOpenIcon,
  TrophyIcon,
  BoltIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const MentorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRepository, setSelectedRepository] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [insights, setInsights] = useState<MentorInsight | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch user's repositories
  const { data: repositories } = useQuery({
    queryKey: ['repositories'],
    queryFn: () => apiClient.getRepositories(),
  });

  // Fetch files for selected repository
  const { data: files } = useQuery({
    queryKey: ['repositoryFiles', selectedRepository],
    queryFn: () => apiClient.getRepository(selectedRepository!),
    enabled: !!selectedRepository,
  });

  const generateInsights = async () => {
    if (!selectedRepository || !selectedFile) return;
    
    setIsGenerating(true);
    try {
      const response = await apiClient.generateMentorInsights(selectedRepository, selectedFile);
      setInsights(response.mentor_insights);
    } catch (error) {
      console.error('Error generating mentor insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition duration-200"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">AI Coding Mentor</h1>
                <span className="text-sm text-gray-500">Personalized learning paths</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Select a file to analyze your coding skills
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - File Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Analyze Your Code</h2>
              
              {/* Repository Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Repository
                </label>
                <select
                  value={selectedRepository || ''}
                  onChange={(e) => {
                    setSelectedRepository(parseInt(e.target.value) || null);
                    setSelectedFile(null);
                    setInsights(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a repository...</option>
                  {repositories?.map((repo) => (
                    <option key={repo.id} value={repo.id}>
                      {repo.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <select
                  value={selectedFile || ''}
                  onChange={(e) => {
                    setSelectedFile(parseInt(e.target.value) || null);
                    setInsights(null);
                  }}
                  disabled={!selectedRepository}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Choose a file...</option>
                  {files?.files?.map((file: CodeFile) => (
                    <option key={file.id} value={file.id}>
                      {file.file_path || 'Untitled'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateInsights}
                disabled={!selectedRepository || !selectedFile || isGenerating}
                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Get Mentor Insights</span>
                  </>
                )}
              </button>

              {/* Instructions */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 flex items-start space-x-2">
                  <LightBulbIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Tip:</strong> Select a file that represents your current coding style and complexity level for the most accurate assessment.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Mentor Insights */}
          <div className="lg:col-span-2">
            {!insights ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <AcademicCapIcon className="w-20 h-20 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to Start Your Learning Journey?
                </h3>
                <p className="text-gray-600 mb-6">
                  Select a repository and file to get personalized coding insights and learning recommendations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="mb-2 flex justify-center">
                      <FlagIcon className="w-10 h-10 text-blue-600" />
                    </div>
                    <div className="font-semibold text-blue-900">Skill Assessment</div>
                    <div className="text-blue-700">Analyze your current coding level</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="mb-2 flex justify-center">
                      <BookOpenIcon className="w-10 h-10 text-green-600" />
                    </div>
                    <div className="font-semibold text-green-900">Learning Path</div>
                    <div className="text-green-700">Personalized curriculum</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="mb-2 flex justify-center">
                      <TrophyIcon className="w-10 h-10 text-purple-600" />
                    </div>
                    <div className="font-semibold text-purple-900">Challenges</div>
                    <div className="text-purple-700">Practice exercises</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Skill Level Assessment */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Level Assessment</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Overall Level */}
                    <div className="text-center">
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getSkillLevelColor(insights.skill_level)}`}>
                        {insights.skill_level.toUpperCase()} LEVEL
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Estimated time to next level: {insights.estimated_time}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Next milestone: {insights.next_milestone}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Current Level</span>
                        <span>Progress</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            insights.skill_level === 'beginner' ? 'bg-green-500 w-1/3' :
                            insights.skill_level === 'intermediate' ? 'bg-yellow-500 w-2/3' :
                            'bg-red-500 w-full'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strengths and Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <BoltIcon className="w-6 h-6 text-green-600 mr-2" />
                      Strengths
                    </h3>
                    <div className="space-y-2">
                      {insights.strengths.map((strength, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FlagIcon className="w-6 h-6 text-yellow-600 mr-2" />
                      Areas to Improve
                    </h3>
                    <div className="space-y-2">
                      {insights.weaknesses.map((weakness, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{weakness}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Learning Path */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BookOpenIcon className="w-6 h-6 text-blue-600 mr-2" />
                    Personalized Learning Path
                  </h3>
                  
                  <div className="space-y-4">
                    {insights.learning_path.map((item: LearningPathItem, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{item.title}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(item.difficulty)}`}>
                              {item.difficulty}
                            </span>
                            <span className="text-xs text-gray-500">{item.estimated_time}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{item.description}</p>
                        
                        {item.resources.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-600">Resources:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.resources.map((resource, rIndex) => (
                                <a
                                  key={rIndex}
                                  href={resource.startsWith('http') ? resource : '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                  {resource.length > 30 ? `${resource.substring(0, 30)}...` : resource}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {item.prerequisites.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-gray-600">Prerequisites:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.prerequisites.map((prereq, pIndex) => (
                                <span key={pIndex} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {prereq}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenges */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrophyIcon className="w-6 h-6 text-purple-600 mr-2" />
                    Recommended Challenges
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insights.challenges.map((challenge: Challenge, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
                              {challenge.difficulty}
                            </span>
                            <span className="text-xs text-gray-500">{challenge.estimated_time}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{challenge.description}</p>
                        
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-600">Skills practiced:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {challenge.skills_practiced.map((skill, sIndex) => (
                              <span key={sIndex} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {challenge.starter_code && (
                          <div className="mt-3">
                            <button className="text-xs text-blue-600 hover:text-blue-800 underline">
                              View starter code
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Regenerate Button */}
                <div className="flex justify-center">
                  <button
                    onClick={generateInsights}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 transition duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh Insights</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
