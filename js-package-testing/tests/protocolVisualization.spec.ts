import { test } from '@applitools/eyes-playwright/fixture'

test.describe('ProtocolVisualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('renders full protocol visualization from analysis', async ({
    page,
    eyes,
  }) => {
    const container = page.getByTestId('protocol-visualization-container')
    await container.waitFor({ state: 'visible' })
    await eyes.check('ProtocolVisualization from analysis', {
      region: container,
      matchLevel: 'Strict',
    })
  })
})
