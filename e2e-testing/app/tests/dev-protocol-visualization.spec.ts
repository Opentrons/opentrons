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
  type ProtocolEntry,
  loadProtocolBundle,
  loadResults,
  pickRandom,
  recordFail,
  recordPass,
} from '../fixtures/protocol-bundle'
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

/** Path to the protocol bundle directory. */
const PROTOCOL_BUNDLE_DIR = resolve(
  __dirname,
  '..',
  'protocol_bundle_chore_release-9.0.0_1771175486',
)

/**
 * Number of protocols to pick from the bundle per run.
 * Set to Infinity to test all remaining untested protocols in one run.
 */
const RANDOM_PROTOCOL_COUNT = Infinity

/**
 * Point the dev app at the bundle's shared custom labware directory.
 * This env var is read by the electron-dev fixture and passed as
 * `--labware.directory` when launching Electron.
 */
if (!process.env.CUSTOM_LABWARE_DIR) {
  process.env.CUSTOM_LABWARE_DIR = resolve(
    PROTOCOL_BUNDLE_DIR,
    'custom_labware',
  )
}

test.describe('Protocol Visualization – Regression', () => {
  test('all protocol steps render without white screens', async ({
    appPage,
  }, testInfo) => {
    // This test clicks through every step — allow up to 5 minutes.
    test.setTimeout(300_000)

    /** Attach a screenshot to the test report. */
    const snapshot = async (name: string): Promise<void> => {
      const body = await appPage.screenshot()
      await testInfo.attach(name, { body, contentType: 'image/png' })
      console.log(`  📸 Screenshot: ${name}`)
    }

    // ---- Setup: wait for the app to be ready ----------------------------
    const app = new AppPage(appPage)
    await app.waitForReady()
    await app.dismissStartupModals()
    console.log('App is ready')

    // ---- Step 1: Navigate to the protocols page -------------------------
    const protocolsPage = new ProtocolsPage(appPage)
    await protocolsPage.navigateToProtocols()
    await protocolsPage.expectPageLoaded()
    await snapshot('01-protocols-page')

    // ---- Step 2: Import the regression test protocol --------------------
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

// ---------------------------------------------------------------------------
// Protocol Bundle – shared helpers
// ---------------------------------------------------------------------------

/** Select untested protocols from the bundle filtered by robot name. */
async function selectProtocols(
  robotName: 'Flex' | 'OT-2',
): Promise<ProtocolEntry[]> {
  const allProtocols = await loadProtocolBundle(PROTOCOL_BUNDLE_DIR)
  const { passed } = await loadResults(PROTOCOL_BUNDLE_DIR)

  const matching = allProtocols.filter(p => p.metadata.robot_name === robotName)
  const untested = matching.filter(p => !passed.has(p.slug))

  console.log(
    `[${robotName}] ${matching.length} total, ` +
      `${matching.length - untested.length} already passed, ` +
      `${untested.length} remaining.`,
  )

  if (untested.length === 0) {
    console.log(`[${robotName}] All protocols have already passed — nothing to test.`)
    return []
  }

  const selected = pickRandom(untested, RANDOM_PROTOCOL_COUNT)
  for (const p of selected) {
    console.log(
      `  Selected: "${p.metadata.name}" (${p.slug}) — ` +
        `${p.metadata.robot_name}, API ${p.metadata.api_level}`,
    )
  }
  return selected
}

/**
 * Run the bundle visualization test for a list of protocols.
 * Shared by both the Flex and OT-2 test describes.
 */
async function runBundleTest(
  protocols: ProtocolEntry[],
  appPage: import('@playwright/test').Page,
  testInfo: import('@playwright/test').TestInfo,
): Promise<void> {
  /** Safe screenshot — silently skips if the page/browser has closed. */
  const snapshot = async (name: string): Promise<void> => {
    try {
      const body = await appPage.screenshot()
      await testInfo.attach(name, { body, contentType: 'image/png' })
      console.log(`  📸 Screenshot: ${name}`)
    } catch {
      console.log(`  ⚠️  Screenshot skipped (page closed): ${name}`)
    }
  }

  /** Safe reload — silently skips if the page/browser has closed. */
  const safeReload = async (): Promise<void> => {
    try {
      await app.reloadAppIfCrashed()
    } catch {
      console.log('  ⚠️  Could not reload app (page closed)')
    }
  }

  const app = new AppPage(appPage)
  await app.waitForReady()
  await app.dismissStartupModals()
  console.log('App is ready')

  const protocolsPage = new ProtocolsPage(appPage)

  for (const protocol of protocols) {
    const label = `${protocol.metadata.name} [${protocol.slug}]`
    const prefix = protocol.slug

    console.log(`\n${'─'.repeat(60)}`)
    console.log(`Testing protocol: ${label}`)
    console.log(
      `  Robot: ${protocol.metadata.robot_name} | API: ${protocol.metadata.api_level}`,
    )
    console.log(`  Custom labware: ${protocol.customLabware.length} file(s)`)
    console.log(`  File: ${protocol.pyFile}`)
    console.log('─'.repeat(60))

    try {
      // Navigate to protocols page
      await protocolsPage.navigateToProtocols()
      await protocolsPage.expectPageLoaded()

      // Import the protocol .py file
      await protocolsPage.importProtocol(protocol.pyFile)

      // Wait for any card to appear (the display name may differ from
      // the bundle metadata name, so we don't match by name).
      await protocolsPage.expectAnyProtocolVisible()
      console.log('Protocol imported and visible')
      await snapshot(`${prefix}-01-imported`)

      // Sort by most recent so the just-imported protocol is first.
      await protocolsPage.setSortByMostRecent()

      // Open the first protocol card (the one we just imported).
      await protocolsPage.openFirstProtocol()

      const detailPage = new ProtocolDetailPage(appPage)
      await detailPage.expectPageLoaded()
      console.log('Protocol detail page loaded')
      await snapshot(`${prefix}-02-detail`)

      // Enter visualization view
      await detailPage.openVisualization()

      const vizPage = new ProtocolVisualizationPage(appPage)
      await vizPage.waitForReady()
      console.log('Visualization view ready')
      await snapshot(`${prefix}-03-viz-initial`)

      // Get total steps
      const totalSteps = await vizPage.getStepCount()
      expect(totalSteps).toBeGreaterThan(0)
      console.log(`Protocol has ${totalSteps} steps`)

      const screenshotCount = 10
      const screenshotInterval = Math.max(
        1,
        Math.floor(totalSteps / screenshotCount),
      )

      // Walk through each step — stop at the first failure.
      let failedAtStep: number | null = null
      let failureReason = ''

      for (let i = 1; i <= totalSteps; i++) {
        try {
          await vizPage.clickStep(i)
          await vizPage.waitForStepRender(i)

          const isBlank = await vizPage.isWhiteScreen()
          if (isBlank) {
            failedAtStep = i
            failureReason = 'WHITE SCREEN'
            console.log(`  Step ${i}: WHITE SCREEN DETECTED — stopping`)
            await snapshot(
              `${prefix}-step-${String(i).padStart(3, '0')}-WHITE-SCREEN`,
            )
            break
          }

          console.log(`  Step ${i}: OK`)

          if (i % screenshotInterval === 0 || i === totalSteps) {
            await snapshot(`${prefix}-step-${String(i).padStart(3, '0')}`)
          }
        } catch (error) {
          failedAtStep = i
          failureReason =
            error instanceof Error ? error.message : String(error)
          console.log(`  Step ${i}: ERROR — ${failureReason} — stopping`)
          await snapshot(
            `${prefix}-step-${String(i).padStart(3, '0')}-ERROR`,
          )
          break
        }
      }

      // Record result to pass.json / fail.json and report.
      if (failedAtStep != null) {
        console.log(
          `\n  FAIL "${label}": ${failureReason} at step ${failedAtStep}/${totalSteps}`,
        )
        await recordFail(
          PROTOCOL_BUNDLE_DIR,
          protocol,
          failureReason,
          failedAtStep,
          totalSteps,
        )
        await safeReload()
        expect.soft(
          failedAtStep,
          `"${label}" failed at step ${failedAtStep}/${totalSteps}: ${failureReason}`,
        ).toBeNull()
      } else {
        console.log(
          `\n  PASS "${label}": all ${totalSteps} steps rendered OK`,
        )
        await recordPass(
          PROTOCOL_BUNDLE_DIR,
          protocol,
          totalSteps,
        )
      }
    } catch (outerError) {
      const reason =
        outerError instanceof Error ? outerError.message : String(outerError)
      console.log(`\n  FAIL "${label}": setup error — ${reason}`)
      await snapshot(`${prefix}-SETUP-ERROR`)
      await recordFail(
        PROTOCOL_BUNDLE_DIR,
        protocol,
        `Setup error: ${reason}`,
      )
      await safeReload()
        expect.soft(
          null,
          `"${label}" failed during setup: ${reason}`,
        ).not.toBeNull()
    }
  }
}

// ---------------------------------------------------------------------------
// Protocol Bundle – Flex
// ---------------------------------------------------------------------------

test.describe('Protocol Bundle – Flex Visualization', () => {
  let selectedProtocols: ProtocolEntry[] = []

  test.beforeAll(async () => {
    selectedProtocols = await selectProtocols('Flex')
  })

  test('Flex protocols render without white screens', async ({
    appPage,
  }, testInfo) => {
    if (selectedProtocols.length === 0) {
      console.log('No Flex protocols to test — skipping.')
      test.skip()
      return
    }
    test.setTimeout(600_000)
    await runBundleTest(selectedProtocols, appPage, testInfo)
  })
})

// ---------------------------------------------------------------------------
// Protocol Bundle – OT-2
// ---------------------------------------------------------------------------

test.describe('Protocol Bundle – OT-2 Visualization', () => {
  let selectedProtocols: ProtocolEntry[] = []

  test.beforeAll(async () => {
    selectedProtocols = await selectProtocols('OT-2')
  })

  test('OT-2 protocols render without white screens', async ({
    appPage,
  }, testInfo) => {
    if (selectedProtocols.length === 0) {
      console.log('No OT-2 protocols to test — skipping.')
      test.skip()
      return
    }
    test.setTimeout(600_000)
    await runBundleTest(selectedProtocols, appPage, testInfo)
  })
})
