/**
 * Smoke tests for the Opentrons desktop application (Electron).
 *
 * These tests launch the installed Opentrons app via Playwright's native
 * Electron API and verify that the application starts and renders its
 * initial UI.
 */

import { expect, test } from '../fixtures/electron-app'
import { AppPage } from '../pages'

test.describe('Opentrons App – Smoke', () => {
  test('app launches and shows a window', async ({ appPage }) => {
    const app = new AppPage(appPage)
    await app.waitForReady()

    // The window title should not be empty.
    const title = await app.getTitle()
    expect(title.length).toBeGreaterThan(0)
    console.log(`Window title: "${title}"`)
  })

  test('app displays initial content', async ({ appPage }) => {
    const app = new AppPage(appPage)
    await app.waitForReady()

    // Take a screenshot for debugging / visual reference.
    await appPage.screenshot({ path: 'test-results/app-initial-content.png' })

    // There should be at least one element containing "Opentrons".
    await app.expectVisibleText('Opentrons', 15_000)
  })

  test('app window has Opentrons in title', async ({ appPage }) => {
    const app = new AppPage(appPage)
    await app.waitForReady()
    await app.expectTitleContains('Opentrons')
  })
})
