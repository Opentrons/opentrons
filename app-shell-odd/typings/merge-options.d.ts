// TODO(mc, 2021-02-16): upgrade merge-options to get built-in TS defs

declare module 'merge-options' {
  function mergeOptions(...options: any[]): any
  export = mergeOptions
}
