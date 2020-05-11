// mock electron-store
'use strict'

const Store = jest.fn()

const mockStore = {
  set: jest.fn(),
  get: jest.fn(),
  has: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  onDidChange: jest.fn(),
  openInEditor: jest.fn(),
  reset: jest.fn(),
}

module.exports = Store
module.exports.__store = mockStore
module.exports.__mockReset = () => {
  Object.values(mockStore).forEach(m => m.mockReset())
  Store.mockReset()
  Store.mockImplementation(() => mockStore)
}
