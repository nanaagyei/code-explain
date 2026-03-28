import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function TemplateManager() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('technical');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [functionPrompt, setFunctionPrompt] = useState('');
  const [classPrompt, setClassPrompt] = useState('');
  const [filePrompt, setFilePrompt] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['prompt-templates', 'all'],
    queryFn: () => apiClient.getPromptTemplates(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.createPromptTemplate({
        name,
        description,
        category,
        language_preference: undefined,
        is_default: false,
        is_public: false,
        system_prompt: systemPrompt,
        function_prompt: functionPrompt,
        class_prompt: classPrompt,
        file_prompt: filePrompt,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompt-templates'] });
      setName('');
      setDescription('');
      setSystemPrompt('');
      setFunctionPrompt('');
      setClassPrompt('');
      setFilePrompt('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.deletePromptTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prompt-templates'] }),
  });

  return (
    <section className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 lg:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Custom Templates</h2>
      <p className="text-sm text-gray-600 mb-5">Create and manage reusable documentation styles.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
          placeholder="Template name"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
        >
          <option value="technical">Technical</option>
          <option value="beginner">Beginner</option>
          <option value="api">API</option>
          <option value="tutorial">Tutorial</option>
        </select>
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-3"
        placeholder="Description"
      />
      <textarea
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-3"
        placeholder="System prompt"
      />
      <textarea
        value={functionPrompt}
        onChange={(e) => setFunctionPrompt(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-3"
        placeholder="Function prompt"
      />
      <textarea
        value={classPrompt}
        onChange={(e) => setClassPrompt(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-3"
        placeholder="Class prompt"
      />
      <textarea
        value={filePrompt}
        onChange={(e) => setFilePrompt(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-3"
        placeholder="File prompt"
      />

      <button
        type="button"
        onClick={() => createMutation.mutate()}
        disabled={!name.trim() || !systemPrompt.trim() || createMutation.isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
      >
        {createMutation.isPending ? 'Saving...' : 'Save template'}
      </button>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Available templates</h3>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading templates...</p>
        ) : (
          <ul className="space-y-2">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                  <p className="text-xs text-gray-500 truncate">{t.category} · {t.usage_count} uses</p>
                </div>
                {!t.is_default && (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(t.id)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
