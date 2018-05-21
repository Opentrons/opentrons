// mock electron module
'use strict'

const path = require('path')
const fs = require('fs')
const os = require('os')

jest.mock('electron-updater', () => ({autoUpdater: {}}))

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

const __tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ot-'))

module.exports = {
  __mockRemotes,
  __clearMock,
  // return jest mocked versions of remote modules
  remote: {
    require: jest.fn((name) => {
      if (__mockRemotes[name]) return __mockRemotes[name]

      const remote = jest.genMockFromModule(
        path.join(__dirname, '../../app-shell/lib', name)
      )

      __mockRemotes[name] = remote
      return remote
    })
  },

  app: {
    getPath: () => __tempDir
  }
}
