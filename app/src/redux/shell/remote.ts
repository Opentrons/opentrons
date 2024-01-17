// access main process remote modules via attachments to `global`
import assert from 'assert'
import { EventEmitter } from 'events'

import type { AxiosRequestConfig } from 'axios'
import type { ResponsePromise } from '@opentrons/api-client'
import type { Remote, NotifyTopic } from './types'

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
  const { data } = config
  // special case: protocol files and form data cannot be sent through invoke. proxy by protocolKey and handle in app-shell
  const formDataProxy =
    data instanceof FormData
      ? { formDataProxy: { protocolKey: data.get('key') } }
      : data
  const configProxy = { ...config, data: formDataProxy }

  return remote.ipcRenderer.invoke('usb:request', configProxy)
}

export function appShellListener(
  hostname: string | null,
  topic: NotifyTopic
): EventEmitter {
  const eventEmitter = new EventEmitter()

  remote.ipcRenderer.on('notify', (_, message) => {
    const {
      shellHostname,
      shellTopic,
      shellMessage,
    } = deserializeNotifyMessage(message)

    // TOME: TEMPORARILY NOT CHECKING HOSTNAME MATCHING, SINCE USING CLOUD PROVIDER.
    // if (hostname === shellHostname && topic === shellTopic) {
    if (topic === shellTopic) {
      eventEmitter.emit('data', shellMessage)
    }
  })
  return eventEmitter
}

function deserializeNotifyMessage(
  message: string
): {
  shellHostname: string
  shellTopic: NotifyTopic
  shellMessage: string | Object
} {
  const delimiter = ':'
  const firstIndex = message.indexOf(delimiter)
  const secondIndex = message.indexOf(delimiter, firstIndex + 1)

  const shellHostname = message.substring(0, firstIndex)
  const shellTopic = message.substring(
    firstIndex + 1,
    secondIndex
  ) as NotifyTopic
  const serializedShellMessage = message.substring(secondIndex + 1)

  let shellMessage: Object | string

  try {
    shellMessage = JSON.parse(serializedShellMessage)
  } catch {
    shellMessage = serializedShellMessage
  }

  return { shellHostname, shellTopic, shellMessage }
}
