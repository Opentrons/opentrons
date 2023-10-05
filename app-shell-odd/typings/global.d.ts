import type { IpcRenderer } from 'electron'

declare global {
  const _PKG_VERSION_: string
  const _PKG_PRODUCT_NAME_: string
  const _PKG_BUGS_URL_: string
  const _OPENTRONS_PROJECT_: string

  namespace NodeJS {
    export interface Global {
      APP_SHELL_REMOTE: {
        ipcRenderer: IpcRenderer
      }
    }
  }
}
