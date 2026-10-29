import { defineConfig, devices } from '@playwright/test'

const isCI = process.env.CI != null && process.env.CI !== ''

/**
 * @see https://playwright.dev/docs/test-configuration
 */
// eslint-disable-next-line import/no-default-export
export default defineConfig({
  testDir: './tests',
  reporter: [['html']],
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1200, height: 800 },
    video: 'retain-on-failure',
    screenshot: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1200, height: 800 },
      },
    },
  ],

  webServer: {
    command: 'make dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !isCI,
    timeout: 60 * 1000,
  },
})
