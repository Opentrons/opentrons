/* eslint-disable no-var */
declare global {
  var APP_SHELL_REMOTE: { ipcRenderer: IpcRenderer; [key: string]: any }
}

declare const _PKG_VERSION_: string
declare const _PKG_PRODUCT_NAME_: string
declare const _PKG_BUGS_URL_: string
declare const _OPENTRONS_PROJECT_: string
