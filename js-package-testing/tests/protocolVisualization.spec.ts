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
    await page
      .getByRole('button', { name: 'Play' })
      .waitFor({ state: 'visible' })

    await eyes.check('ProtocolVisualization initial step', {
      region: container,
      matchLevel: 'Strict',
    })

    // TimelineScrubber track_container uses height: 0 (hit-area via ::before), so
    // Playwright treats it as hidden and page.mouse may miss hit-testing.
    // Annotated steps are virtualized, so listitem.last() is only the last rendered
    // row. Dispatch mousedown at the track's right edge so TrackSlider seeks to end.
    const scrubberTrack = container
      .locator('[class*="track_container"]')
      .first()
    await scrubberTrack.waitFor({ state: 'attached' })

    await scrubberTrack.evaluate(el => {
      const rect = el.getBoundingClientRect()
      if (rect.width < 10) {
        throw new Error('Protocol visualization scrubber has no width')
      }
      const clientX = rect.right - 2
      const clientY = rect.top
      el.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
          buttons: 1,
          view: window,
        })
      )
      window.dispatchEvent(
        new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
          view: window,
        })
      )
    })

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
