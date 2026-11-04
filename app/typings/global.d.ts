declare const global: typeof globalThis & {
  APP_SHELL_REMOTE: {
    // sa 02-02-2024 any typing this because importing the IpcRenderer type
    // from electron makes this ambient type declaration a module instead of
    // a script, which typescript does not like
    ipcRenderer: any
    [key: string]: any
  }
}

// Build-time constants, supplied by vite.config.mts.
declare const _PKG_VERSION_: string
declare const _GIT_COMMIT_HASH_: string
declare const _GIT_BRANCH_NAME_: string
declare const _OPENTRONS_PROJECT_: string
declare const _NODE_ENV_: string | undefined
declare const _OT_APP_MIXPANEL_ID_: string | undefined
declare const _ODD_IP_: string | undefined
declare const _OT_SENTRY_DSN_: string
