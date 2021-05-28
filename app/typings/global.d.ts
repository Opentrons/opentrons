import type { IpcRenderer } from 'electron'

declare global {
  namespace NodeJS {
    export interface Global {
      APP_SHELL_REMOTE: {
        ipcRenderer: IpcRenderer
      }
      btoa: (str: string | Buffer) => string
      Intercom?: (...args: any[]) => unknown
      [key: string]: unknown
    }
  }
}
