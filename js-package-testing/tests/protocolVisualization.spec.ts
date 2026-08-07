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

    // TimelineScrubber's track_container uses height: 0 (hit-area via ::before),
    // so Playwright treats it as hidden. Jump to the last annotated step instead.
    const lastStep = container.getByRole('listitem').last()
    await lastStep.scrollIntoViewIfNeeded()
    await lastStep.click()

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
