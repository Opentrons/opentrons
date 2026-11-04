import 'dotenv/config'

import { defineConfig, devices } from '@playwright/test'

import type { EyesFixture } from '@applitools/eyes-playwright/fixture'

const isCI = process.env.CI != null && process.env.CI !== ''

/**
 * @see https://playwright.dev/docs/test-configuration
 * @see https://applitools.com/docs/eyes/playwright
 */
// eslint-disable-next-line import/no-default-export
export default defineConfig<EyesFixture>({
  testDir: './tests',
  reporter: [['html'], ['@applitools/eyes-playwright/reporter']],
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1200, height: 800 },
    video: 'retain-on-failure',
    screenshot: 'on',
    eyesConfig: {
      appName: 'js-package-testing',
      failTestsOnDiff: 'afterEach',
    },
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
