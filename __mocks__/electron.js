// mock electron module
// 'use strict'
import { vi } from 'vitest'

module.exports = {
  app: {
    getPath: () => '__mock-app-path__',
    once: vi.fn(),
  },

  ipcRenderer: {
    on: vi.fn(),
    send: vi.fn(),
  },

  dialog: {
    // https://electronjs.org/docs/api/dialog#dialogshowopendialogbrowserwindow-options
    showOpenDialog: vi.fn(),
  },

  shell: {
    trashItem: vi.fn(),
    openPath: vi.fn(),
  },
}
