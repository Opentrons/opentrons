declare const global: typeof globalThis & {
  enablePrereleaseMode: () => void
}

// Build-time constants, supplied by Vite config.
declare const _NODE_ENV_: string | undefined
declare const _OT_AI_CLIENT_MIXPANEL_ID_: string | undefined
