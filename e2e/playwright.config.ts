import { PlaywrightTestConfig } from '@playwright/test'
const config: PlaywrightTestConfig = {
  outputDir: 'results',
  reporter: [['json', { outputFile: 'results/results.json' }], ['list']],
  use: {
    // Browser options
    headless: false,
    slowMo: 100,

    // Context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Artifacts
    screenshot: 'on',
    video: 'retry-with-video',
  },
}
export default config
