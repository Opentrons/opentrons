declare const global: typeof globalThis & {
  document: {
    getElementsByClassName: (val: string) => any[]
  }
  enablePrereleaseMode: () => void
}

interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: (val: string) => any
}

declare module '*.md' {
  const content: string
  export { content }
}

// Build-time constants, supplied by Vite config.
declare const _FF_ENV_VARS_: Record<string, string | undefined>
declare const _NODE_ENV_: string | undefined
declare const _OT_PD_BUILD_DATE_: string | undefined
declare const _OT_PD_MIXPANEL_DEV_ID_: string | undefined
declare const _OT_PD_MIXPANEL_ID_: string | undefined
declare const _OT_PD_REQUIRED_APP_VERSION_: string | undefined
declare const _OT_PD_SENTRY_DEV_DSN_: string | undefined
declare const _OT_PD_SENTRY_DSN_: string | undefined
declare const _OT_PD_VERSION_: string | undefined
