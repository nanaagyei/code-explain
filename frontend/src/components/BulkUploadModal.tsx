import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { BatchJobItemCreate } from '../types/index';
import { Rocket, XCircle } from 'lucide-react';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BulkUploadModal({ isOpen, onClose }: BulkUploadModalProps) {
  const queryClient = useQueryClient();
  const [batchName, setBatchName] = useState('');
  const [githubUrls, setGithubUrls] = useState('');
  const [maxFiles, setMaxFiles] = useState(100);

  const createBatchMutation = useMutation({
    mutationFn: (batchJob: { name: string; items: BatchJobItemCreate[] }) =>
      apiClient.createBatchJob(batchJob),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] });
      queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
      onClose();
      // Reset form
      setBatchName('');
      setGithubUrls('');
      setMaxFiles(100);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse GitHub URLs (one per line)
    const urls = githubUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    if (urls.length === 0) {
      return;
    }
    
    // Create batch job items
    const items: BatchJobItemCreate[] = urls.map((url) => {
      // Extract repo name from URL
      const match = url.match(/github\.com\/[^/]+\/([^/]+)/);
      const repoName = match ? match[1].replace(/\.git$/, '') : 'repository';
      
      return {
        name: repoName,
        source_type: 'github',
        source_data: {
          url,
          max_files: maxFiles
        }
      };
    });
    
    createBatchMutation.mutate({
      name: batchName || `Batch Job - ${new Date().toLocaleString()}`,
      items
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl transform transition-all border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Rocket className="w-6 h-6" />
              <span>Bulk Upload</span>
            </h3>
            <p className="text-sm text-gray-600 mt-1">Process multiple GitHub repositories at once</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl leading-none w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition duration-200"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Batch Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Batch Name (Optional)
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="My Batch Job"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none font-medium"
            />
          </div>

          {/* GitHub URLs */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              GitHub URLs (one per line)
            </label>
            <textarea
              value={githubUrls}
              onChange={(e) => setGithubUrls(e.target.value)}
              placeholder={`https://github.com/user/repo1\nhttps://github.com/user/repo2\nhttps://github.com/user/repo3`}
              rows={8}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none font-medium resize-none"
            />
            <p className="mt-2 text-xs text-gray-600">
              {githubUrls.split('\n').filter(u => u.trim()).length} repositories
            </p>
          </div>

          {/* Max Files */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Max Files Per Repository: {maxFiles}
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={maxFiles}
              onChange={(e) => setMaxFiles(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10 files</span>
              <span>500 files</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Bulk Processing</h4>
                <p className="text-xs text-blue-700">
                  All repositories will be processed in the background. You can track progress in the Batch Jobs section.
                  Processing may take several minutes depending on repository size.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createBatchMutation.isPending || !githubUrls.trim()}
              className="flex-1 px-4 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg"
            >
              {createBatchMutation.isPending ? 'Creating Batch...' : 'Start Batch Processing'}
            </button>
          </div>

          {/* Error Message */}
          {createBatchMutation.isError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center justify-center space-x-2 text-red-700 text-sm font-medium">
                <XCircle className="w-5 h-5" />
                <span>{(createBatchMutation.error as Error)?.message || 'Failed to create batch job'}</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
