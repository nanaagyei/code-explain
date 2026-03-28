import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    // Legacy Jest-style suite; keep file for reference but skip until aligned with Vitest + current UI copy.
    exclude: [...configDefaults.exclude, 'src/tests/CodeAnalysis.test.tsx'],
  },
});
