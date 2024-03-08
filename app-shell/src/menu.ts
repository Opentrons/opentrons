/* eslint-disable @typescript-eslint/no-var-requires */
// application menu
import { Menu, shell } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'

import { LOG_DIR } from './log'

const PRODUCT_NAME: string = _PKG_PRODUCT_NAME_
const BUGS_URL: string = _PKG_BUGS_URL_

// file or application menu
const firstMenu: MenuItemConstructorOptions = {
  role: process.platform === 'darwin' ? 'appMenu' : 'fileMenu',
}

const editMenu: MenuItemConstructorOptions = { role: 'editMenu' }

const viewMenu: MenuItemConstructorOptions = { role: 'viewMenu' }

const windowMenu: MenuItemConstructorOptions = { role: 'windowMenu' }

const helpMenu: MenuItemConstructorOptions = {
  role: 'help',
  submenu: [
    {
      label: 'Learn More',
      click: () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        shell.openExternal('https://opentrons.com/')
      },
    },
    {
<<<<<<< HEAD
      label: `View ${PRODUCT_NAME} App Logs`,
=======
      // @ts-expect-error can't get TS to recognize global.d.ts
      label: `View ${global._PKG_PRODUCT_NAME_} App Logs`,
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
      click: () => {
        shell.openPath(LOG_DIR)
      },
    },
    {
      label: 'Report an Issue',
      click: () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
<<<<<<< HEAD
        shell.openExternal(BUGS_URL)
=======
        // @ts-expect-error can't get TS to recognize global.d.ts
        shell.openExternal(global._PKG_BUGS_URL_)
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
      },
    },
  ],
}

const template = [firstMenu, editMenu, viewMenu, windowMenu, helpMenu]

export function initializeMenu(): void {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
