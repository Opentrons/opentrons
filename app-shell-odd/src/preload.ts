// preload script for renderer process
// defines subset of Electron API that renderer process is allowed to access
// for security reasons
import { ipcRenderer } from 'electron'

// @ts-expect-error can't get TS to recognize global.d.ts
global.APP_SHELL_REMOTE = { ipcRenderer }
