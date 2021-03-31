// labware-library/typings/global.d.ts
declare module NodeJS {
  interface ProcessEnv {
    OT_LL_VERSION: string
    OT_LL_BUILD_DATE: string
  }
}
