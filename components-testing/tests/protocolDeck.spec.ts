import { expect, test } from '@playwright/test'

test.describe('ProtocolDeck Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders deck from analysis', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const protocolDeckContainer = page.getByTestId('protocol-deck-container')
    await protocolDeckContainer.waitFor({ state: 'visible' })
    await expect(protocolDeckContainer).toHaveScreenshot('deck.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.1, // Allow up to 10% pixel differences for headed vs un-headed consistency
    })
  })
})
