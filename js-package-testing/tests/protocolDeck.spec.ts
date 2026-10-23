import { expect, test } from '@playwright/test'

test.describe('ProtocolDeck Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/deck-map')
  })

  test('renders deck map from analysis', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const protocolDeckContainer = page.getByTestId('protocol-deck-container')
    await protocolDeckContainer.waitFor({ state: 'visible' })
  })
})
