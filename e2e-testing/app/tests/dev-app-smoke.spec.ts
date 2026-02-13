/**
 * Smoke tests for the Opentrons desktop application in dev mode.
 *
 * These tests launch the dev version of the app (Vite dev-server +
 * Electron shell from source) and verify that the application starts
 * and renders its initial UI.
 */

import { expect, test } from '../fixtures/electron-dev'
import { AppPage } from '../pages'

test.describe('Opentrons Dev App – Smoke', () => {
  test('dev app launches and shows a window', async ({ appPage }) => {
    const app = new AppPage(appPage)
    await app.waitForReady()

    // The window title should not be empty.
    const title = await app.getTitle()
    expect(title.length).toBeGreaterThan(0)
    console.log(`Window title: "${title}"`)
  })

  test('dev app displays initial content', async ({ appPage }) => {
    const app = new AppPage(appPage)
    await app.waitForReady()

    // Take a screenshot for debugging / visual reference.
    await appPage.screenshot({
      path: 'test-results/dev-app-initial-content.png',
    })

    // There should be at least one element containing "Opentrons".
    await app.expectVisibleText('Opentrons', 15_000)
  })

  test('dev app window has Opentrons in title', async ({ appPage }) => {
    const app = new AppPage(appPage)
    await app.waitForReady()
    await app.expectTitleContains('Opentrons')
  })
})
