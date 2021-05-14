// access main process remote modules via attachments to `global`
import assert from 'assert'

import type { Remote } from './types'

// @ts-expect-error
export const remote: Remote = new Proxy(
  {},
  {
    get(_target, propName: string): unknown {
      assert(
        global.APP_SHELL_REMOTE,
        'Expected APP_SHELL_REMOTE to be attached to global scope; is app-shell/src/preload.js properly configured?'
      )

      assert(
        propName in global.APP_SHELL_REMOTE,
        `Expected APP_SHELL_REMOTE.${String(
          propName
        )} to exist, is app-shell/src/preload.js properly configured?`
      )
      return global.APP_SHELL_REMOTE[propName]
    },
  }
)
