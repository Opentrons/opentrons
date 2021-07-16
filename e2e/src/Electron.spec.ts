import { test, expect } from '@playwright/test'
import { ElectronApplication, _electron as electron } from 'playwright'

test.only('use electron', async () => {
  //test.skip(true, 'only on electron')
  const electronApp: ElectronApplication = await electron.launch({
    args: ['/Users/johnmcvey/github/opentrons/opentrons/app-shell/lib/main.js'],
    env: {
      PATH: `/Users/johnmcvey/github/opentrons/opentrons/app/node_modules/.bin:/Users/johnmcvey/github/opentrons/opentrons/node_modules/.bin:/Users/johnmcvey/github/opentrons/opentrons/app-shell/node_modules/.bin:${process.env.PATH}`,
      ...process.env,
      NODE_ENV: 'development',
      OT_APP_UI__URL__PATH: 'localhost:8080',
      OT_APP_DISCOVERY__CANDIDATES: 'localhost',
      OT_APP_UI__URL__PROTOCOL: 'http:',
      OT_APP_UI__WEB_PREFERENCES__WEB_SECURITY: 'false',
      OT_APP_LOG__LEVEL__CONSOLE: 'debug',
    },
    cwd: '/Users/johnmcvey/github/opentrons/opentrons/app-shell/',
    bypassCSP: true,
    //executablePath:
    //  '/Users/johnmcvey/github/opentrons/opentrons/node_modules/.bin/electron',
  })
  // Evaluation expression in the Electron context.
  const appPath = await electronApp.evaluate(async ({ app }) => {
    // This runs in the main Electron process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.getAppPath()
  })
  console.log(appPath)
  const rosetta = await electronApp.evaluate(async ({ app }) => {
    return app.runningUnderRosettaTranslation
  })
  console.log(rosetta)
  //await new Promise(f => setTimeout(f, 60000))
  // Get the first window that the app opens, wait if necessary.
  const window = await electronApp.firstWindow()
  // Print the title.
  console.log(await window.title())
  console.log(electronApp.windows())
  // Capture a screenshot.
  electronApp.browserWindow(window)
  // Direct Electron console to Node terminal.
  await new Promise(f => setTimeout(f, 5000))
  await window.click('button')
  await window.screenshot({ path: 'intro.png' })
  window.on('console', console.log)
  // Exit app.
  await electronApp.close()
})
