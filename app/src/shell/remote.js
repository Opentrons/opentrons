// @flow
// access main process remote modules via attachments to `global`
import assert from 'assert'

const remote = new Proxy(
  {},
  {
    get(target, propName) {
      assert(
        global.APP_SHELL_REMOTE,
        'Expected APP_SHELL_REMOTE to be attached to global scope; is app-shell/src/preload.js properly configured?'
      )

      assert(
        propName in global.APP_SHELL_REMOTE,
        `Expected APP_SHELL_REMOTE.${propName} to exist, is app-shell/src/preload.js properly configured?`
      )

      return global.APP_SHELL_REMOTE[propName]
    },
  }
)

export default remote
