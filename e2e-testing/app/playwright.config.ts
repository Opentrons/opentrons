import { defineConfig } from '@playwright/test'

/**
 * Playwright configuration for Opentrons desktop app (Electron) E2E tests.
 *
 * The tests launch the installed Electron app with `--remote-debugging-port`
 * and connect via CDP, so no `webServer` configuration is needed.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  /* Fail the build on CI if test.only is left in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests once on CI, never locally. */
  retries: process.env.CI ? 1 : 0,

  /* Limit parallel workers on CI to avoid resource contention. */
  workers: 1,

  /* Reporter configuration. */
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/html-report' }],
  ],

  /* Shared settings for all projects. */
  use: {
    /* Capture screenshot on failure. */
    screenshot: 'only-on-failure',

    /* Record video for every test. */
    video: 'on',

    /* Collect trace on first retry. */
    trace: 'on-first-retry',
  },

  /* Output directory for test artifacts. */
  outputDir: 'test-results/artifacts',

  /* Global timeout per test. */
  timeout: 60_000,

  /* Expect timeout. */
  expect: {
    timeout: 10_000,
  },

  projects: [
    {
      name: 'electron-app',
      testMatch: '**/app-smoke.spec.ts',
    },
    {
      name: 'electron-dev',
      testMatch: '**/dev-*.spec.ts',
    },
  ],
})
