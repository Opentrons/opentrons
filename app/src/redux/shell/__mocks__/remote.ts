// mock remote object
// keep in sync with app-shell/src/preload.js
import { vi } from 'vitest'

const EventEmitter = require('events')

class MockIpcRenderer extends EventEmitter {
  send = vi.fn() as any
}

export const remote = { ipcRenderer: new MockIpcRenderer() }
