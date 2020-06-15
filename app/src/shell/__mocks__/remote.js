// mock remote object
// keep in sync with app-shell/src/preload.js

const EventEmitter = require('events')

class MockIpcRenderer extends EventEmitter {
  send = jest.fn()
}

export const remote = { ipcRenderer: new MockIpcRenderer() }
