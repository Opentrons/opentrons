import { defineConfig, devices } from '@playwright/test'

const isCI = process.env.CI != null && process.env.CI !== ''

/**
 * @see https://playwright.dev/docs/test-configuration
 */
// eslint-disable-next-line import/no-default-export
export default defineConfig({
    testDir: './tests',
    // Remove the platform from the snapshot filename so the local snapshot
    // from a dev's Mac matches Ubuntu in CI
    snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:5173',
        /* Consistent viewport for all tests */
        viewport: { width: 1200, height: 800 },
        /* Disable video recording to avoid performance issues */
        video: 'retain-on-failure',
        screenshot: 'on',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                /* Override any device-specific settings for consistency */
                viewport: { width: 1200, height: 800 },
            },
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'make dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !isCI,
        timeout: 60 * 1000, // 1 minute
    },
})