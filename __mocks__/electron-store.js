// mock electron-store
'use strict'
import { vi } from 'vitest'
module.exports = vi.mock(
  '../app-shell/node_modules/electron-store'
)
