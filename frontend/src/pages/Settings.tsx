import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { UserApiKey, UserApiKeyCreate, UserApiKeyUpdate } from '../types/index';

export default function Settings() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingKey, setEditingKey] = useState<UserApiKey | null>(null);
  const [newKey, setNewKey] = useState<UserApiKeyCreate>({
    name: '',
    provider: 'openai',
    api_key: '',
    is_active: true
  });

  // Fetch user's API keys
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['user-api-keys'],
    queryFn: () => apiClient.getUserApiKeys(),
  });

  // Add new API key mutation
  const addKeyMutation = useMutation({
    mutationFn: (keyData: UserApiKeyCreate) => apiClient.createUserApiKey(keyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-api-keys'] });
      setShowAddModal(false);
      setNewKey({ name: '', provider: 'openai', api_key: '', is_active: true });
    },
  });

  // Update API key mutation
  const updateKeyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserApiKeyUpdate }) => 
      apiClient.updateUserApiKey(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-api-keys'] });
      setEditingKey(null);
    },
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: (id: number) => apiClient.deleteUserApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-api-keys'] });
    },
  });

  const handleAddKey = () => {
    if (!newKey.name.trim() || !newKey.api_key.trim()) return;
    addKeyMutation.mutate(newKey);
  };

  const handleUpdateKey = (id: number, data: UserApiKeyUpdate) => {
    updateKeyMutation.mutate({ id, data });
  };

  const handleDeleteKey = (id: number) => {
    if (confirm('Are you sure you want to delete this API key?')) {
      deleteKeyMutation.mutate(id);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return '🤖';
      case 'anthropic': return '🧠';
      case 'azure': return '☁️';
      default: return '🔑';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return 'bg-green-100 text-green-800 border-green-200';
      case 'anthropic': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'azure': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition duration-200"
              >
                ← Back to Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl font-bold">C</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                  <p className="text-xs text-gray-500 font-medium">Manage your API keys and preferences</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API Keys Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🔑 API Keys</h2>
              <p className="text-gray-600">
                Manage your API keys for different AI providers. Your keys are encrypted and stored securely.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition duration-200 shadow-lg flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add API Key</span>
            </button>
          </div>

          {/* API Keys List */}
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
          ) : apiKeys && apiKeys.length > 0 ? (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{getProviderIcon(key.provider)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getProviderColor(key.provider)}`}>
                            {key.provider.toUpperCase()}
                          </span>
                        </div>
                        <div className={`px-3 py-1 text-xs font-bold rounded-full ${
                          key.is_active 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {key.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Key:</span> {key.key_prefix}
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>Used {key.usage_count} times</span>
                          <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                          {key.last_used_at && (
                            <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleUpdateKey(key.id, { is_active: !key.is_active })}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 ${
                          key.is_active
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {key.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => setEditingKey(key)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition duration-200"
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">🔑</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">No API keys yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Add your first API key to start using custom AI providers for documentation generation.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition duration-200 shadow-lg"
              >
                Add Your First API Key
              </button>
            </div>
          )}
        </div>

        {/* Usage Statistics */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Usage Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium mb-1">Total API Calls</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {apiKeys?.reduce((sum, key) => sum + key.usage_count, 0) || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📞</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium mb-1">Active Keys</p>
                  <p className="text-3xl font-bold text-green-900">
                    {apiKeys?.filter(key => key.is_active).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium mb-1">Providers</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {new Set(apiKeys?.map(key => key.provider)).size || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏢</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add API Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Add API Key</h3>
                <p className="text-sm text-gray-600 mt-1">Your key will be encrypted and stored securely</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition duration-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  placeholder="My OpenAI Key"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Provider
                </label>
                <select
                  value={newKey.provider}
                  onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none font-medium"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="azure">Azure OpenAI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={newKey.api_key}
                  onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none font-medium"
                />
                <p className="mt-2 text-xs text-gray-600">
                  Your API key will be encrypted and only the first 8 characters will be visible for identification.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newKey.is_active}
                  onChange={(e) => setNewKey({ ...newKey, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-900">
                  Activate this key immediately
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddKey}
                disabled={!newKey.name.trim() || !newKey.api_key.trim() || addKeyMutation.isPending}
                className="flex-1 px-4 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg"
              >
                {addKeyMutation.isPending ? 'Adding...' : 'Add API Key'}
              </button>
            </div>

            {addKeyMutation.isError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm text-center font-medium">
                  ❌ Failed to add API key
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit API Key Modal */}
      {editingKey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Edit API Key</h3>
                <p className="text-sm text-gray-600 mt-1">Update your API key settings</p>
              </div>
              <button
                onClick={() => setEditingKey(null)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition duration-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  defaultValue={editingKey.name}
                  onChange={(e) => setEditingKey({ ...editingKey, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none font-medium"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={editingKey.is_active}
                  onChange={(e) => setEditingKey({ ...editingKey, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="edit_is_active" className="text-sm font-medium text-gray-900">
                  Active
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setEditingKey(null)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateKey(editingKey.id, { 
                  name: editingKey.name, 
                  is_active: editingKey.is_active 
                })}
                disabled={updateKeyMutation.isPending}
                className="flex-1 px-4 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg"
              >
                {updateKeyMutation.isPending ? 'Updating...' : 'Update Key'}
              </button>
            </div>

            {updateKeyMutation.isError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm text-center font-medium">
                  ❌ Failed to update API key
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
