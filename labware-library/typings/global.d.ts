// labware-library/typings/global.d.ts
declare module NodeJS {
  interface Global {
    _fs_namespace: string | undefined
  }
  interface ProcessEnv {
    OT_LL_VERSION: string
    OT_LL_BUILD_DATE: string
  }
}
