import { defineConfig } from 'vitest/config';

// Standalone test config: node environment, no app plugins. Keeps the pure
// service-logic tests fast and isolated from the browser/Vite build pipeline.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
});
