import type { IpcRenderer } from 'electron'

declare global {
  namespace NodeJS {
    export interface Global {
      APP_SHELL_REMOTE: {
        ipcRenderer: IpcRenderer
        [key: string]: unknown
      }
      btoa: (str: string | Buffer) => string;
      [key: string]: unknown
    }
  }
}
