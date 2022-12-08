// preload script for renderer process
// defines subset of Electron API that renderer process is allowed to access
// for security reasons
import { ipcRenderer } from 'electron'
import { autoUpdater as updater } from 'electron-updater'

global.APP_SHELL_REMOTE = { ipcRenderer }
// LATEST_OT_SYSTEM_VERSION will get updated at runtime when a new sw update is available
global.LATEST_OT_SYSTEM_VERSION = updater.currentVersion.version