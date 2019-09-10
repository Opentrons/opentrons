// application menu
import { Menu } from 'electron'

import pkg from '../package.json'

// file or application menu
const firstMenu = {
  role: process.platform === 'darwin' ? 'appMenu' : 'fileMenu',
}

const editMenu = { role: 'editMenu' }

const viewMenu = { role: 'viewMenu' }

const windowMenu = { role: 'windowMenu' }

const helpMenu = {
  role: 'help',
  submenu: [
    {
      label: 'Learn More',
      click: () => {
        require('electron').shell.openExternal('https://opentrons.com/')
      },
    },
    {
      label: 'Report an Issue',
      click: () => {
        require('electron').shell.openExternal(pkg.bugs.url)
      },
    },
  ],
}

const template = [firstMenu, editMenu, viewMenu, windowMenu, helpMenu]

export default function initializeMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
