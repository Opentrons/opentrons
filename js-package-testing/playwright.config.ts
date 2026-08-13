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
      // CI fails on visual diffs so baselines must be accepted in Eyes after
      // intentional fixture changes. Locally, diffs are reported but do not
      // fail the run (override with APPLITOOLS_FAIL_ON_DIFF=true|false).
      failTestsOnDiff:
        process.env.APPLITOOLS_FAIL_ON_DIFF === 'true'
          ? 'afterEach'
          : process.env.APPLITOOLS_FAIL_ON_DIFF === 'false'
            ? false
            : isCI
              ? 'afterEach'
              : false,
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
