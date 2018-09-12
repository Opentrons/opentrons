// mock electron module
'use strict'

const path = require('path')

jest.mock('electron-updater', () => ({autoUpdater: {}}))

jest.mock(
  '../../app-shell/src/log',
  () => require('../src/__mocks__/logger').default
)

const __mockRemotes = {}

const __clearMock = () => {
  Object.keys(__mockRemotes).forEach((remoteName) => {
    const remote = __mockRemotes[remoteName]

    Object.keys(remote).forEach((property) => {
      const value = remote[property]
      value && value.mockClear && value.mockClear()
    })
  })
}

module.exports = {
  __mockRemotes,
  __clearMock,
  // return jest mocked versions of remote modules
  remote: {
    require: jest.fn((name) => {
      if (__mockRemotes[name]) return __mockRemotes[name]

      const remote = jest.genMockFromModule(
        path.join(__dirname, '../../app-shell/src', name)
      )

      __mockRemotes[name] = remote
      return remote
    }),
  },

  app: {
    getPath: () => '__mock-app-path__',
  },

  ipcRenderer: {
    on: jest.fn(),
    send: jest.fn(),
  },
}
