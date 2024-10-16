export const cssModuleSideEffect = (): any => {
  return {
    name: 'css-module-side-effectful',
    enforce: 'post',
    transform(_: any, id: any) {
      if (id.includes('.module.')) {
        return {
          moduleSideEffects: 'no-treeshake', // or true, which also works with slightly better treeshake
        }
      }
    },
  }
}
