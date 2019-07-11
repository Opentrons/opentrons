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
}
