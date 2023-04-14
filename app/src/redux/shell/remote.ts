// access main process remote modules via attachments to `global`
import assert from 'assert'

import type { AxiosRequestConfig } from 'axios'
import type { ResponsePromise } from '@opentrons/api-client'
import type { Remote } from './types'

const emptyRemote: Remote = {} as any

export const remote: Remote = new Proxy(emptyRemote, {
  get(_target, propName: string): unknown {
    assert(
      global.APP_SHELL_REMOTE,
      'Expected APP_SHELL_REMOTE to be attached to global scope; is app-shell/src/preload.js properly configured?'
    )

    assert(
      propName in global.APP_SHELL_REMOTE,
      `Expected APP_SHELL_REMOTE.${propName} to exist, is app-shell/src/preload.js properly configured?`
    )
    // @ts-expect-error TODO we know that propName is 'ipcRenderer' but TS can't narrow it down
    return global.APP_SHELL_REMOTE[propName] as Remote
  },
})

export function appShellRequestor<Data>(
  config: AxiosRequestConfig
): ResponsePromise<Data> {
  return remote.ipcRenderer.invoke('usb:request', config)
}
