// mock remote object
// keep in sync with app-shell/src/preload.js
'use strict'

module.exports = {
  ipcRenderer: {
    on: jest.fn(),
    send: jest.fn(),
  },
  apiUpdate: {
    getUpdateInfo: jest.fn(),
    getUpdateFileContents: jest.fn(),
  },
  config: {
    getConfig: jest.fn(),
  },
  discovery: {
    getRobots: jest.fn(),
  },
  update: {
    CURRENT_VERSION: '0.0.0',
    CURRENT_RELEASE_NOTES: 'Release notes for 0.0.0',
  },
}
