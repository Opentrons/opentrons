// @flow
// preload script for renderer process
// defines subset of Electron API that renderer process is allowed to access
// for security reasons
import { ipcRenderer } from 'electron'

global.APP_SHELL_REMOTE = { ipcRenderer }
