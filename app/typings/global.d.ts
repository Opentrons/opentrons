declare const global: typeof globalThis & {
  _PKG_VERSION_: string
  _OPENTRONS_PROJECT_: string
  APP_SHELL_REMOTE: {
    // sa 02-02-2024 any typing this because importing the IpcRenderer type
    // from electron makes this ambient type declaration a module instead of
    // a script, which typescript does not like
    ipcRenderer: any
  }
}
