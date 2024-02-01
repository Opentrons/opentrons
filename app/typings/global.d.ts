import type { IpcRenderer } from 'electron'

declare global {
  declare module globalThis {
    var APP_SHELL_REMOTE: { ipcRenderer: IpcRenderer }
    var btoa: (str: string | Buffer) => string
    export const _PKG_VERSION_: string
    export const _OPENTRONS_PROJECT_: string
  }
}
