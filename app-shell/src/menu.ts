/* eslint-disable @typescript-eslint/no-var-requires */
// application menu
import { Menu } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'

import { LOG_DIR } from './log'

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
        require('electron').shell.openExternal('https://opentrons.com/')
      },
    },
    {
      // @ts-expect-error can't get TS to recognize global.d.ts
      label: `View ${global._PKG_PRODUCT_NAME_} App Logs`,
      click: () => {
        require('electron').shell.openPath(LOG_DIR)
      },
    },
    {
      label: 'Report an Issue',
      click: () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        // @ts-expect-error can't get TS to recognize global.d.ts
        require('electron').shell.openExternal(global._PKG_BUGS_URL_)
      },
    },
  ],
}

const template = [firstMenu, editMenu, viewMenu, windowMenu, helpMenu]

export function initializeMenu(): void {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
