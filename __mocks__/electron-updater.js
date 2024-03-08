// mock electron-updater
'use strict'
import { vi } from 'vitest'
const EventEmitter = require('events')
const autoUpdater = new EventEmitter()

module.exports.autoUpdater = autoUpdater
module.exports.__mockReset = () => {
  Object.assign(autoUpdater, {
    autoDownload: true,
    autoInstallOnAppQuit: true,
    allowDowngrade: false,
    currentVersion: { version: '0.0.0-mock' },
    channel: null,

    checkForUpdates: vi.fn(),
    checkForUpdatesAndNotify: vi.fn(),
    downloadUpdate: vi.fn(),
    getFeedURL: vi.fn(),
    setFeedURL: vi.fn(),
    quitAndInstall: vi.fn(),
  })
}

module.exports.__mockReset()
