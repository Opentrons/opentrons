import { PlaywrightTestConfig } from '@playwright/test'
export const config: PlaywrightTestConfig = {
  outputDir: 'results',
  reporter: [['json', { outputFile: 'results/results.json' }], ['list']],
}
