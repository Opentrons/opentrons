// mock electron-store
'use strict'
import { vi } from 'vitest'

// will by default mock the config dir. if you need other behaavior you can
// override this mock (see app-shell/src/__tests__/discovery.test.ts for an example)
const Store = vi.fn(function () {
  this.store = vi.fn(() => {
    return {}
  })
  this.get = vi.fn(property => {
    return {}
  })
  this.onDidChange = vi.fn()
})

// eslint-disable-next-line import/no-default-export
export default Store

// const Store = vi.fn(function () {
//   this.store = vi.fn(() => migrate(DEFAULTS_V12))
//   this.get = vi.fn(property => {
//     return this.store()[property]
//   })
//   this.onDidChange = vi.fn()
// })
