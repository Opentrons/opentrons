import { test as base } from '@playwright/test'
import { join } from 'path'
import { ElectronApplication, _electron as electron } from 'playwright'

export async function epoch(): Promise<number> {
  return Math.round(new Date().getTime() / 1000)
}

const root: string = join(__dirname, '..', '..')
const electronMain: string = join(root, 'app-shell', 'lib', 'main.js')
const appShell: string = join(root, 'app-shell')
const rootModules: string = join(root, 'node_modules', '.bin')
const appModules: string = join(root, 'app', 'node_modules', '.bin')
const appShellModules: string = join(appShell, 'node_modules', '.bin')
const currentPath: string = process.env.PATH ?? ''
console.log(root)
// Note how we mark the fixture as { scope: 'worker' }.
// Also note that we pass empty {} first, since we do not declare any test fixtures.
export const test = base.extend<{}, { electronApp: ElectronApplication }>({
  electronApp: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const electronApp: ElectronApplication = await electron.launch({
        args: [electronMain],
        env: {
          PATH: `${rootModules}:${appModules}:${appShellModules}:${currentPath}`,
          ...process.env,
          NODE_ENV: 'development',
          OT_APP_UI__URL__PATH: 'localhost:8080',
          OT_APP_DISCOVERY__CANDIDATES: 'localhost',
          OT_APP_UI__URL__PROTOCOL: 'http:',
          OT_APP_UI__WEB_PREFERENCES__WEB_SECURITY: 'false',
          OT_APP_LOG__LEVEL__CONSOLE: 'debug',
        },
        cwd: appShell,
        bypassCSP: true,
      })

      const window = await electronApp.firstWindow()
      console.log(`the window title is: ${await window.title()}`)
      // Wait for a button then capture a screenshot.
      await window.waitForSelector('button', { state: 'visible' })
      await window.screenshot({ path: `results/initial-${await epoch()}.png` })
      window.on('console', console.log)

      // Use the electron app in the tests.
      await use(electronApp)

      // Cleanup.
      await electronApp.close()
    },
    { scope: 'worker' },
  ],
})
