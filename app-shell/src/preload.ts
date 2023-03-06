// preload script for renderer process
// defines subset of Electron API that renderer process is allowed to access
// for security reasons
import { ipcRenderer } from 'electron'

const windowLoaded = new Promise(resolve => {
  window.onload = resolve
})

ipcRenderer.on('main-world-port', (async (event: any) => {
  await windowLoaded
  // We use regular window.postMessage to transfer the port from the isolated
  // world to the main world.
  window.postMessage('main-world-port', '*', event.ports)
}) as any)

global.APP_SHELL_REMOTE = { ipcRenderer }
