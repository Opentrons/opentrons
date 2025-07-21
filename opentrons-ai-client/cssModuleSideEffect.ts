import type { Plugin } from 'vite'

/**
 * Plugin to make sure CSS modules do not get tree shaked out of the dist.
 * see https://github.com/vitejs/vite/pull/16051
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
