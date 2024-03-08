declare const global: typeof globalThis & {
<<<<<<< HEAD
=======
  _PKG_VERSION_: string
  _OPENTRONS_PROJECT_: string
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
  APP_SHELL_REMOTE: {
    // sa 02-02-2024 any typing this because importing the IpcRenderer type
    // from electron makes this ambient type declaration a module instead of
    // a script, which typescript does not like
    ipcRenderer: any
    [key: string]: any
  }
}

declare const _PKG_VERSION_: string
declare const _OPENTRONS_PROJECT_: string
