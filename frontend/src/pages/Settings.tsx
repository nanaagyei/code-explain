import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { getUserFriendlyError } from '../utils/errorMessages';
import type { UserApiKey, UserApiKeyCreate, UserApiKeyUpdate } from '../types/index';
import { BackButton } from '../components/BackButton';
import {
  Key,
  Cloud,
  Brain,
  Bot,
  CheckCircle2,
  Building2,
  Phone,
  BarChart3,
  X,
  XCircle,
  CreditCard,
  Wallet,
  RefreshCw,
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuthStore();
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

  // Billing (moved from Dashboard)
  const { data: billingSummary } = useQuery({
    queryKey: ['billing', 'summary'],
    queryFn: () => apiClient.getBillingSummary(),
    enabled: Boolean(user),
    retry: false,
  });
  const { data: creditPacks } = useQuery({
    queryKey: ['billing', 'packs'],
    queryFn: () => apiClient.getCreditPacks(),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000,
  });
  const { data: billingTransactions } = useQuery({
    queryKey: ['billing', 'transactions'],
    queryFn: () => apiClient.getBillingTransactions(),
    enabled: Boolean(user),
  });
  const checkoutMutation = useMutation({
    mutationFn: (packId: number) => apiClient.createCheckoutSession(packId),
    onSuccess: (session) => {
      window.open(session.url, '_blank', 'noopener,noreferrer');
    },
  });
  const refreshBilling = () => {
    queryClient.invalidateQueries({ queryKey: ['billing'], exact: false });
  };
  const formatCurrency = (amountCents: number, currency = 'usd') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amountCents / 100);
  const creditValueFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

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
      case 'openai': return <Bot className="w-5 h-5" />;
      case 'anthropic': return <Brain className="w-5 h-5" />;
      case 'azure': return <Cloud className="w-5 h-5" />;
      default: return <Key className="w-5 h-5" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return 'bg-green-100 text-green-800 border-green-200';
      case 'anthropic': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'azure': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 lg:mb-8">
          <BackButton to="/dashboard" label="Back to Dashboard" />
          <div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-charcoal-950">Settings</h1>
            <p className="text-sm text-slate-600 mt-0.5">Manage API keys, billing, and preferences</p>
          </div>
        </div>
        {/* API Keys Section */}
        <div id="api-keys" className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
                <Key className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>API Keys</span>
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Manage your API keys for different AI providers. Your keys are encrypted and stored securely.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-600 transition duration-200 shadow-lg flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <span className="text-gray-600">{getProviderIcon(key.provider)}</span>
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
              <div className="mb-4 flex justify-center">
                <Key className="w-16 h-16 text-gray-400" />
              </div>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6" />
            <span>Usage Statistics</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium mb-1">Total API Calls</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {apiKeys?.reduce((sum, key) => sum + key.usage_count, 0) || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium mb-1">Active Keys</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {apiKeys?.filter(key => key.is_active).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium mb-1">Providers</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {new Set(apiKeys?.map(key => key.provider)).size || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-slate-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Billing & Credits */}
        <div id="billing" className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Billing & Credits</span>
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Manage your platform credits, purchase packs, and view recent activity. Powered by Stripe.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-blue-600 text-white rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-5 h-5" />
                <p className="text-sm font-medium text-white/80">Current balance</p>
              </div>
              <p className="text-3xl font-bold">
                {billingSummary ? billingSummary.wallet.balance_credits.toLocaleString() : '—'} credits
              </p>
              <p className="text-sm text-white/80 mt-2">
                1 credit ≈ {billingSummary ? billingSummary.tokens_per_credit.toLocaleString() : '—'} tokens
                {billingSummary
                  ? ` (${creditValueFormatter.format(billingSummary.estimated_token_cost_per_credit)} per credit)`
                  : ''}
              </p>
              <p className="text-xs text-white/70 mt-3">
                {billingSummary?.has_user_provided_api_key
                  ? 'Your API key is connected. Credits apply only if you disconnect it.'
                  : 'Credits are used when you run AI without your own API key.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <a href="#api-keys" className="flex-1 text-center bg-white/90 text-blue-700 font-semibold py-2 rounded-lg hover:bg-white transition text-sm">
                  Manage API keys
                </a>
                <button
                  type="button"
                  onClick={refreshBilling}
                  className="flex-1 flex items-center justify-center gap-2 border border-white/60 text-white font-semibold py-2 rounded-lg hover:bg-white/10 transition text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh balance
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Prepaid credit packs</h3>
                {creditPacks && creditPacks.length > 0 ? (
                  <div className="space-y-2">
                    {creditPacks.map((pack) => (
                      <div
                        key={pack.id}
                        className="flex items-center justify-between border border-slate-200 rounded-xl px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{pack.name}</p>
                          <p className="text-xs text-gray-500">
                            {pack.credits.toLocaleString()} credits · {formatCurrency(pack.price_cents, pack.currency)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => checkoutMutation.mutate(pack.id)}
                          disabled={checkoutMutation.isPending}
                          className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          Buy
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No credit packs configured. Connect your own API key or check back later.</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent billing activity</h3>
                <ul className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  {billingTransactions && billingTransactions.length > 0 ? (
                    billingTransactions.slice(0, 5).map((tx) => (
                      <li key={tx.id} className="flex items-center justify-between px-4 py-3 bg-white">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tx.description || tx.transaction_type}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`text-sm font-semibold ${tx.credits_delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.credits_delta > 0 ? '+' : ''}{tx.credits_delta} cr
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-3 text-sm text-gray-500">No billing activity yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                <div className="flex items-center justify-center space-x-2 text-red-700 text-sm font-medium">
                  <XCircle className="w-5 h-5" />
                  <span>{getUserFriendlyError(addKeyMutation.error, { operation: 'add API key' })}</span>
                </div>
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
                className="text-gray-400 hover:text-gray-600 w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-100 rounded-xl transition duration-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
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
                <div className="flex items-center justify-center space-x-2 text-red-700 text-sm font-medium">
                  <XCircle className="w-5 h-5" />
                  <span>{getUserFriendlyError(updateKeyMutation.error, { operation: 'update API key' })}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
