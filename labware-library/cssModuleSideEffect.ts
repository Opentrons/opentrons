import type { Plugin } from 'vite'

/**
 * Creates a Vite plugin that marks CSS modules as having side effects
 *
 * @returns {Plugin} The Vite plugin object.
 */

export const cssModuleSideEffect = (): Plugin => {
  return {
    name: 'css-module-side-effectful',
    enforce: 'post',
    transform(_: string, id: string) {
      if (id.includes('.module.')) {
        return {
          moduleSideEffects: 'no-treeshake', // or true, which also works with slightly better treeshake
        }
      }
    },
  }
}
