import { ElectronApplication, _electron as electron } from 'playwright'

/* it('use electron', async () => {
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
}, 60000) */

import { Browser, Page } from 'playwright'

declare global {
  const page: Page
  const browser: Browser
  const browserName: string
}

async function dismissUpdateModal(): Promise<void> {
  const updateDialog = await page.$('text=Not Now')
  if (updateDialog) {
    await updateDialog.click()
  }
}

it('Successfully loads page', async () => {
  await page.goto('http://localhost:8090')
  await page.screenshot({ path: `./screenshots/app-${browserName}.png` })
  await dismissUpdateModal()
  await page.screenshot({ path: `./screenshots/dialog-${browserName}.png` })
  // Click button
  await page.click('button')
  expect(page.url()).toBe('http://localhost:8090/#/robots/opentrons-dev')
  await page.screenshot({ path: `./screenshots/robot-${browserName}.png` })
  await dismissUpdateModal()
  const visible: Boolean = await page.isVisible(':is(h2:has-text("Robots"))')
  expect(visible).toBeTruthy()
  const hiddenProtocolMenu = await page.textContent(
    '[aria-describedby="Tooltip__2"]'
  )
  expect(hiddenProtocolMenu).toBe('Protocol')
  const hiddenCalibrateMenu = await page.textContent(
    '[aria-describedby="Tooltip__3"]'
  )
  expect(hiddenCalibrateMenu).toBe('Calibrate')
  const hiddenRunMenu = await page.textContent(
    '[aria-describedby="Tooltip__4"]'
  )
  expect(hiddenRunMenu).toBe('Run')
})
