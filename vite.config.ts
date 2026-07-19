import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No build-time secret injection: the Gemini API key is supplied by the user at
// runtime (BYO-key, stored in the browser). Nothing is baked into the bundle,
// so the built site is safe to deploy publicly.
export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
