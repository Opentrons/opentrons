import { test } from '@applitools/eyes-playwright/fixture'

test.describe('ProtocolDeck Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/deck-map')
    await page.waitForLoadState('networkidle')
  })

  test('renders Flex deck map from analysis', async ({ page, eyes }) => {
    const protocolDeckContainer = page.getByTestId('protocol-deck-flex')
    await protocolDeckContainer.waitFor({ state: 'visible' })
    await eyes.check('Components DeckMap Flex', {
      region: protocolDeckContainer,
      matchLevel: 'Strict',
    })
  })

  test('renders OT-2 deck map from analysis', async ({ page, eyes }) => {
    const protocolDeckContainer = page.getByTestId('protocol-deck-ot2')
    await protocolDeckContainer.waitFor({ state: 'visible' })
    await eyes.check('Components DeckMap OT-2', {
      region: protocolDeckContainer,
      matchLevel: 'Strict',
    })
  })
})
