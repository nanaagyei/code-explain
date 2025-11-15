import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { PromptTemplate } from '../types';
import { 
  Baby, 
  FlaskConical, 
  BookOpen, 
  Book, 
  ClipboardList, 
  FileText, 
  AlertTriangle 
} from 'lucide-react';

interface PromptTemplateSelectorProps {
  selectedTemplateId: number | null;
  onTemplateSelect: (templateId: number | null) => void;
  language?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  beginner: <Baby className="w-5 h-5" />,
  technical: <FlaskConical className="w-5 h-5" />,
  api: <BookOpen className="w-5 h-5" />,
  tutorial: <Book className="w-5 h-5" />
};

const categoryColors: Record<string, string> = {
  beginner: 'bg-success-100 text-success-800 border-success-200',
  technical: 'bg-electric-100 text-electric-800 border-electric-200',
  api: 'bg-charcoal-100 text-charcoal-800 border-charcoal-200',
  tutorial: 'bg-orange-100 text-orange-800 border-orange-200'
};

export const PromptTemplateSelector: React.FC<PromptTemplateSelectorProps> = ({
  selectedTemplateId,
  onTemplateSelect,
  language
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['promptTemplates', selectedCategory, language],
    queryFn: () => apiClient.getPromptTemplates(
      selectedCategory === 'all' ? undefined : selectedCategory,
      language
    ),
  });

  const categories = [
    { id: 'all', name: 'All Templates', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'beginner', name: 'Beginner-Friendly', icon: <Baby className="w-5 h-5" /> },
    { id: 'technical', name: 'Technical Deep-Dive', icon: <FlaskConical className="w-5 h-5" /> },
    { id: 'api', name: 'API Documentation', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'tutorial', name: 'Tutorial Style', icon: <Book className="w-5 h-5" /> }
  ];

  const handleTemplateSelect = (template: PromptTemplate) => {
    onTemplateSelect(template.id);
    // Track usage
    apiClient.usePromptTemplate(template.id).catch(console.error);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-charcoal-200 rounded animate-pulse"></div>
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-charcoal-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="mb-2 flex justify-center">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-charcoal-600">Failed to load prompt templates</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-electric-600 hover:text-electric-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center ${
              selectedCategory === category.id
                ? 'bg-electric-500 text-white'
                : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
            }`}
          >
            <span className="mr-1.5 flex items-center">{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid gap-3 max-h-64 overflow-y-auto">
        {templates?.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
              selectedTemplateId === template.id
                ? 'border-electric-500 bg-electric-50'
                : 'border-charcoal-200 bg-white hover:border-charcoal-300'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">
                  {categoryIcons[template.category] || <FileText className="w-5 h-5" />}
                </span>
                <h3 className="font-semibold text-charcoal-900">
                  {template.name}
                </h3>
                {template.is_default && (
                  <span className="px-2 py-0.5 bg-electric-100 text-electric-700 text-xs rounded-full">
                    Default
                  </span>
                )}
              </div>
              <div className="text-sm text-charcoal-500">
                {template.usage_count} uses
              </div>
            </div>
            
            <p className="text-charcoal-600 text-sm mb-3">
              {template.description}
            </p>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${categoryColors[template.category] || 'bg-gray-100 text-gray-800'}`}>
                {template.category}
              </span>
              {template.language_preference && (
                <span className="px-2 py-1 bg-charcoal-100 text-charcoal-700 text-xs rounded-full inline-flex items-center">
                  {template.language_preference}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {templates?.length === 0 && (
        <div className="text-center py-8">
          <div className="mb-2 flex justify-center">
            <ClipboardList className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-charcoal-600">No templates found for this category</p>
        </div>
      )}
    </div>
  );
};
