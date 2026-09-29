import {
  defineConfig,
  devices,
} from '@playwright/test';

export default defineConfig({
  testDir: './MainTest/EndtoEndTest',

  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  timeout: 45_000,

  expect: {
    timeout: 10_000,
  },

  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: 'never',
      },
    ],
  ],

  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',

    // Disabled because Playwright's FFmpeg was not downloaded.
    video: 'off',
  },

  webServer: {
    command:
      'npm run dev -- --host 127.0.0.1 --port 4173',

    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,

    env: {
      ...process.env,
      VITE_USE_FIREBASE_EMULATOR: 'true',
    },
  },

  projects: [
    {
      name: 'Google Chrome',
      use: {
        ...devices['Desktop Chrome'],

        // Uses Chrome already installed in Windows.
        channel: 'chrome',
      },
    },
  ],

  outputDir: 'test-results/e2e',
});