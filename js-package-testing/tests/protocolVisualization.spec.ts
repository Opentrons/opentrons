import { test } from '@applitools/eyes-playwright/fixture'

test.describe('ProtocolVisualization', () => {
  test.setTimeout(60_000)

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
    await scrubberTrack.waitFor({ state: 'visible' })

    // Drag the scrubber thumb to the end. A single end-click is flaky because
    // TrackSlider subtracts thumb radius from the usable width.
    const scrubberBox = await scrubberTrack.boundingBox()
    if (scrubberBox == null) {
      throw new Error('Protocol visualization scrubber was not visible')
    }
    const y = scrubberBox.y + scrubberBox.height / 2
    await page.mouse.move(scrubberBox.x + 8, y)
    await page.mouse.down()
    await page.mouse.move(scrubberBox.x + scrubberBox.width - 2, y, {
      steps: 8,
    })
    await page.mouse.up()

    await page.getByText('100% complete').waitFor({ state: 'visible' })

    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every(a => a.playState === 'finished' || a.playState === 'idle')
    )

    await eyes.check('ProtocolVisualization last step', {
      region: container,
      matchLevel: 'Strict',
    })
  })
})
