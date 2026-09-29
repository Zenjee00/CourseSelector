import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,

    include: [
      'MainTest/FirebaseTest/**/*.{test,spec}.{js,jsx}',
    ],

    exclude: [
      'node_modules/**',
      'dist/**',
      'MainTest/EndtoEndTest/**',
    ],

    fileParallelism: false,

    testTimeout: 20000,
    hookTimeout: 20000,

    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
  },
});