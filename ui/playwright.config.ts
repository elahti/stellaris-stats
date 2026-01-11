import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './playwright/tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: `http://${process.env.STELLARIS_STATS_VITE_HOST ?? 'localhost'}:${process.env.STELLARIS_STATS_VITE_PORT ?? '5173'}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  globalSetup: './playwright/global-setup.ts',
  globalTeardown: './playwright/global-teardown.ts',

  webServer: {
    command: 'npm run dev',
    url: `http://${process.env.STELLARIS_STATS_VITE_HOST ?? 'localhost'}:${process.env.STELLARIS_STATS_VITE_PORT ?? '5173'}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
})
