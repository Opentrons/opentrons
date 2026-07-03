import { test } from '@applitools/eyes-playwright/fixture'

test.describe('ProtocolDeck Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/deck-map')
  })

  test('renders deck map from analysis', async ({ page, eyes }) => {
    await page.waitForLoadState('networkidle')
    const protocolDeckContainer = page.getByTestId('protocol-deck-container')
    await protocolDeckContainer.waitFor({ state: 'visible' })
    await eyes.check('Components DeckMap from analysis', {
      region: protocolDeckContainer,
      matchLevel: 'Strict',
    })
  })
})
