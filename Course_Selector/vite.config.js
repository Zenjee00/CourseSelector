import { defineConfig } from 'vitest/config';

import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5174',
    },
  },

  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase',
              test: /[\\/]node_modules[\\/](?:@firebase|firebase)[\\/]/,
            },
          ],
        },
      },
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/Test/setup.js',
    css: true,

    include: [
      'src/Test/**/*.{test,spec}.{js,jsx}',
    ],

    exclude: [
      'node_modules/**',
      'dist/**',
      'MainTest/**',
    ],

    testTimeout: 20000,
    hookTimeout: 20000,

    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
  },
});