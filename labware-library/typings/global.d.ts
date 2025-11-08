// labware-library/typings/global.d.ts
declare module NodeJS {
  // todo(mm, 2025-09-15): This appears unused?
  interface ProcessEnv {
    OT_LL_VERSION: string
    OT_LL_BUILD_DATE: string
  }
}

// Build-time constants, supplied by Vite config.
declare const _NODE_ENV_: string | undefined
declare const _OT_LL_MIXPANEL_ID_: string | undefined
declare const _OT_LL_MIXPANEL_DEV_ID_: string | undefined
