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
      (global as any).APP_SHELL_REMOTE,
      'Expected APP_SHELL_REMOTE to be attached to global scope; is app-shell/src/preload.ts properly configured?'
    )

    assert(
      propName in (global as any).APP_SHELL_REMOTE,
      `Expected APP_SHELL_REMOTE.${propName} to exist, is app-shell/src/preload.ts properly configured?`
    )
    return (global as any).APP_SHELL_REMOTE[propName] as Remote
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
  remote.ipcRenderer.on(
    'notify',
    (_, shellHostname, shellTopic, shellMessage) => {
      console.log('Received notification data from main via IPC', {
        hostname: shellHostname,
        topic: shellTopic,
        message: shellMessage,
      })

      if (hostname === shellHostname && topic === shellTopic) {
        eventEmitter.emit('data', shellMessage)
      }
    }
  )
  return eventEmitter
}
