// @flow
// access main process remote modules via attachments to `global`
import assert from 'assert'

assert(
  global.APP_SHELL_REMOTE,
  'Expected APP_SHELL_REMOTE to be attached to global scope; is app-shell/src/preload.js properly configured?'
)

const remote = new Proxy(global.APP_SHELL_REMOTE, {
  get(target, propName) {
    assert(
      propName in target,
      `Expected APP_SHELL_REMOTE.${propName} to exist, is app-shell/src/preload.js properly configured?`
    )

    return target[propName]
  },
})

export default remote
