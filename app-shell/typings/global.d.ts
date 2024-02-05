declare global {
  var _PKG_VERSION_: string
  var _PKG_PRODUCT_NAME_: string
  var _PKG_BUGS_URL_: string
  var _OPENTRONS_PROJECT_: string
  var APP_SHELL_REMOTE: { ipcRenderer: IpcRenderer, [key: string]: any }
}
