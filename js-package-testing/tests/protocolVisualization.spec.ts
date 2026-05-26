import { test } from '@applitools/eyes-playwright/fixture'

test.describe('ProtocolVisualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/protocol-visualization')
    await page.waitForLoadState('networkidle')
  })

  test('captures first and last protocol steps', async ({ page, eyes }) => {
    const container = page.getByTestId('protocol-visualization-container')
    await container.waitFor({ state: 'visible' })
    await eyes.check('ProtocolVisualization initial step', {
      region: container,
      matchLevel: 'Strict',
    })

    const scrubberTrack = container
      .locator('[class*="track_container"]')
      .first()
    await scrubberTrack.waitFor({ state: 'attached' })
    const scrubberBox = await scrubberTrack.boundingBox()
    if (scrubberBox == null) {
      throw new Error('Protocol visualization scrubber was not visible')
    }

    await page.mouse.click(
      scrubberBox.x + scrubberBox.width - 1,
      scrubberBox.y + scrubberBox.height / 2
    )
    await page.getByText('100% complete').waitFor({ state: 'visible' })
    // Wait for CSS transitions to settle (AnnotatedSteps has 500ms background/border transitions)
    await page.waitForFunction(() =>
      document.getAnimations().every(a => a.playState !== 'running')
    )

    await eyes.check('ProtocolVisualization last step', {
      region: container,
      matchLevel: 'Strict',
    })
  })
})
