/**
 * Protocol Visualization regression test.
 *
 * Imports a Flex protocol into the dev app, navigates to the
 * visualization view, and validates that every protocol step
 * renders correctly without white screens or errors.
 *
 * Ported from the standalone helpers.js / playwright_in_app.js scripts.
 */

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from '../fixtures/electron-dev'
import {
  AppPage,
  ProtocolDetailPage,
  ProtocolsPage,
  ProtocolVisualizationPage,
} from '../pages'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** Name of the protocol as it appears in the app UI. */
const PROTOCOL_NAME = 'Regression test protocol Flex NEW'

/** Path to the protocol fixture file. */
const PROTOCOL_FILE = resolve(
  __dirname,
  '..',
  'fixtures',
  'Regression_test_protocol_Flex_new.py',
)

test.describe('Protocol Visualization – Regression', () => {
  test('all protocol steps render without white screens', async ({
    appPage,
  }, testInfo) => {
    /** Attach a screenshot to the test report. */
    const snapshot = async (name: string): Promise<void> => {
      const body = await appPage.screenshot()
      await testInfo.attach(name, { body, contentType: 'image/png' })
      console.log(`  📸 Screenshot: ${name}`)
    }

    // ---- Setup: wait for the app to be ready ----------------------------
    const app = new AppPage(appPage)
    await app.waitForReady()
    console.log('App is ready')

    // ---- Step 1: Navigate to the protocols page -------------------------
    const protocolsPage = new ProtocolsPage(appPage)
    await protocolsPage.navigateToProtocols()
    await protocolsPage.expectPageLoaded()
    await snapshot('01-protocols-page')

    // ---- Step 2: Import the regression test protocol --------------------
    await protocolsPage.openImportSlideout()
    await protocolsPage.importProtocol(PROTOCOL_FILE)

    // Wait for the protocol to appear in the list (analysis may take time).
    await protocolsPage.expectProtocolVisible(PROTOCOL_NAME)
    console.log('Protocol imported and visible')
    await snapshot('02-protocol-imported')

    // ---- Step 3: Open the protocol detail page --------------------------
    await protocolsPage.openProtocol(PROTOCOL_NAME)

    const detailPage = new ProtocolDetailPage(appPage)
    await detailPage.expectPageLoaded()
    console.log('Protocol detail page loaded')
    await snapshot('03-protocol-detail')

    // ---- Step 4: Enter visualization view -------------------------------
    await detailPage.openVisualization()

    const vizPage = new ProtocolVisualizationPage(appPage)
    await vizPage.waitForReady()
    console.log('Visualization view ready')
    await snapshot('04-visualization-initial')

    // ---- Step 5: Get the total number of steps --------------------------
    const totalSteps = await vizPage.getStepCount()
    expect(totalSteps).toBeGreaterThan(0)
    console.log(`Protocol has ${totalSteps} steps to validate`)

    // Take ~20 screenshots spread evenly across all steps.
    const screenshotCount = 20
    const screenshotInterval = Math.max(
      1,
      Math.floor(totalSteps / screenshotCount),
    )

    // ---- Step 6: Iterate through each step and validate rendering -------
    const whiteScreenSteps: number[] = []
    const errorSteps: Array<{ step: number; error: string }> = []

    for (let i = 1; i <= totalSteps; i++) {
      try {
        // Click the step to display it.
        await vizPage.clickStep(i)

        // Wait for the step content to render.
        await vizPage.waitForStepRender(i)

        // Check for a white/blank screen.
        const isBlank = await vizPage.isWhiteScreen()
        if (isBlank) {
          console.log(`  Step ${i}: WHITE SCREEN DETECTED`)
          whiteScreenSteps.push(i)
          // Always screenshot white-screen failures.
          await snapshot(`step-${String(i).padStart(3, '0')}-WHITE-SCREEN`)
        } else {
          console.log(`  Step ${i}: rendered correctly`)
        }

        // Take a periodic screenshot.
        if (i % screenshotInterval === 0 || i === totalSteps) {
          await snapshot(`step-${String(i).padStart(3, '0')}`)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.log(`  Step ${i}: ERROR — ${message}`)
        errorSteps.push({ step: i, error: message })
        // Always screenshot errors.
        await snapshot(`step-${String(i).padStart(3, '0')}-ERROR`)
      }
    }

    // ---- Step 7: Report results -----------------------------------------
    console.log(`\n${'='.repeat(60)}`)
    console.log('TEST RESULTS SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total steps tested:        ${totalSteps}`)
    console.log(`Steps with white screens:  ${whiteScreenSteps.length}`)
    console.log(`Steps with errors:         ${errorSteps.length}`)

    if (whiteScreenSteps.length > 0) {
      console.log(`\nWhite screen steps: ${whiteScreenSteps.join(', ')}`)
    }

    if (errorSteps.length > 0) {
      console.log('\nError details:')
      for (const { step, error } of errorSteps) {
        console.log(`  Step ${step}: ${error}`)
      }
    }

    console.log('='.repeat(60))

    // ---- Assertions -----------------------------------------------------
    expect(
      whiteScreenSteps,
      `Steps with white screens: ${whiteScreenSteps.join(', ')}`,
    ).toHaveLength(0)

    expect(
      errorSteps,
      `Steps with errors: ${errorSteps.map(e => `${e.step}`).join(', ')}`,
    ).toHaveLength(0)
  })
})
