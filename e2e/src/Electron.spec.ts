import { test } from '@playwright/test'
import { ElectronApplication, _electron as electron } from 'playwright'

test('use electron', async () => {
  test.skip(true, 'only on electron')
  const electronApp: ElectronApplication = await electron.launch({
    args: [
      '/Users/johnmcvey/github/opentrons/opentrons/app-shell/',
      'log.level.console="debug"',
      'disable_ui.webPreferences.webSecurity',
      'ui.url.protocol="http:"',
      'ui.url.path="localhost:8080"',
      'discovery.candidates=localhost',
    ],
    bypassCSP: true,
    executablePath:
      '/Users/johnmcvey/github/opentrons/opentrons/node_modules/.bin/electron',
  })
  // Evaluation expression in the Electron context.
  const appPath = await electronApp.evaluate(async ({ app }) => {
    // This runs in the main Electron process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.getAppPath()
  })
  console.log(appPath)
  await new Promise(f => setTimeout(f, 60000))
  // Get the first window that the app opens, wait if necessary.
  const window = await electronApp.firstWindow()
  // Print the title.
  console.log(await window.title())
  // Capture a screenshot.
  await window.screenshot({ path: 'intro.png' })
  // Direct Electron console to Node terminal.
  window.on('console', console.log)
  // Exit app.
  await electronApp.close()
})
