import type { IpcRenderer } from 'electron'

declare global {
  const _PKG_VERSION_: string
  const _PKG_PRODUCT_NAME_: string
  const _PKG_BUGS_URL_: string
  const _DEFAULT_ROBOT_UPDATE_SOURCE_CONFIG_SELECTION_: 'OT3' | 'OT2'

  namespace NodeJS {
    export interface Global {
      APP_SHELL_REMOTE: {
        ipcRenderer: IpcRenderer
      }
    }
  }
}
