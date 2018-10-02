// @flow
// preload script for renderer process
// defines subset of Electron API that renderer process is allowed to access
// for security reasons
import {ipcRenderer, remote} from 'electron'

global.APP_SHELL = {
  ipcRenderer,
  apiUpdate: remote.require('./api-update'),
  config: remote.require('./config'),
  discovery: remote.require('./discovery'),
  update: remote.require('./update'),
}
