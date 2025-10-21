// preload script for renderer process
// defines subset of Electron API that renderer process is allowed to access
// for security reasons
import { contextBridge, ipcRenderer, webUtils } from 'electron'

// The renderer process is not permitted the file path for any type "file" input
// post Electron v32. The correct way of doing this involves the context bridge,
// see comments in Electron settings.
// See https://www.electronjs.org/docs/latest/breaking-changes#removed-filepath
const getFilePathFrom = (file: File): Promise<string> => {
  return Promise.resolve(webUtils.getPathForFile(file))
}

// @ts-expect-error can't get TS to recognize global.d.ts
global.APP_SHELL_REMOTE = { ipcRenderer, getFilePathFrom }

/**
 * contextBridge exposes a safe, limited API from the main process to renderer processes.
 *
 * This is needed for protocol viz's seconadary window because:
 * 1. Renderer processes (React/secondary windows) cannot access main process memory
 *    or Node APIs directly in a secure Electron context.
 * 2. PV's secondary window needs large, constantly updating data (robotState, analysis)
 *    from the main process. Using IPC via this bridge allows it to fetch data on demand
 *    and subsrbe to changes in real time.
 */
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      ipcRenderer.send(channel, ...args)
    },
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => {
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.removeListener(channel, listener)
    },
    removeListener: (
      channel: string,
      listener: (event: any, ...args: any[]) => void
    ) => {
      ipcRenderer.removeListener(channel, listener)
    },
    invoke: (channel: string, ...args: any[]) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return ipcRenderer.invoke(channel, ...args)
    },
    once: (channel: string, listener: (event: any, ...args: any[]) => void) => {
      ipcRenderer.once(channel, listener)
    },
  },
})
