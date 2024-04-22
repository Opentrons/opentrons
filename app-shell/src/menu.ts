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
      label: `View ${PRODUCT_NAME} App Logs`,
      click: () => {
        shell.openPath(LOG_DIR)
      },
    },
    {
      label: 'Report an Issue',
      click: () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        shell.openExternal(BUGS_URL)
      },
    },
  ],
}

const template = [firstMenu, editMenu, viewMenu, windowMenu, helpMenu]

export function initializeMenu(): void {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
