// mock remote object
// keep in sync with app-shell/src/preload.js
'use strict'

const EventEmitter = require('events')

class MockIpcRenderer extends EventEmitter {
  send = jest.fn()
}

module.exports = {
  ipcRenderer: new MockIpcRenderer(),
  apiUpdate: {
    getUpdateInfo: jest.fn(),
    getUpdateFileContents: jest.fn(),
  },
  CURRENT_VERSION: '0.0.0',
  CURRENT_RELEASE_NOTES: 'Release notes for 0.0.0',
  INITIAL_CONFIG: {},
  INITIAL_ROBOTS: [],
}
