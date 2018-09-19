// mock electron-updater
'use strict'

const EventEmitter = require('events')
const autoUpdater = new EventEmitter()

module.exports.autoUpdater = autoUpdater
module.exports.__mockReset = () => {
  Object.assign(autoUpdater, {
    autoDownload: true,
    autoInstallOnAppQuit: true,
    allowDowngrade: false,
    currentVersion: '0.0.0-mock',
    channel: null,

    checkForUpdates: jest.fn(),
    checkForUpdatesAndNotify: jest.fn(),
    downloadUpdate: jest.fn(),
    getFeedURL: jest.fn(),
    setFeedURL: jest.fn(),
    quitAndInstall: jest.fn(),
  })
}

module.exports.__mockReset()
