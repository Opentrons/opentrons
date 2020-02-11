// mock electron module
'use strict'

module.exports = {
  app: {
    getPath: () => '__mock-app-path__',
    once: jest.fn(),
  },

  ipcRenderer: {
    on: jest.fn(),
    send: jest.fn(),
  },

  dialog: {
    // https://electronjs.org/docs/api/dialog#dialogshowopendialogbrowserwindow-options
    showOpenDialog: jest.fn(),
  },

  shell: {
    moveItemToTrash: jest.fn(),
    openItem: jest.fn(),
  },
}
