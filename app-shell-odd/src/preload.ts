// preload script for renderer process
// defines subset of Electron API that renderer process is allowed to access
// for security reasons
import { ipcRenderer, contextBridge } from 'electron'

global.APP_SHELL_REMOTE = { ipcRenderer }

contextBridge.exposeInMainWorld('electron', {
  path: path,
  file_manage_process: async (data: any) =>
    await ipcRenderer.invoke('file_manage_process', data),
})
