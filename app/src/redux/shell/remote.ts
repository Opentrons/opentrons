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

// TODO(jh, 2024-01-09): Remove "host" as a dependency.
// TOME: WHERE SHOULD I ABSTRACT THIS TO? Ideally you want to wrap the subscribe/unsubscribe as well, so this needs to go within the react api I thin.
export function appShellListener(
  hostname: string | null,
  topic: NotifyTopic
): EventEmitter {
  // TOME: I think having the eventEmitter emit an event from the stream is a-ok. I'd do it like HOST:SUBSCRIPTION.
  // The cool thing is it self regulates here! You don't have to manager subscriptions on this level at all.
  // Can you even do the subscribing from in here as well? That would be tight.
  const eventEmitter = new EventEmitter()
  remote.ipcRenderer.on('mqtt', (_, data) => {
    const [shellHostname, shellTopic, shellMessage] = data.split(':')
    // You'd emit the subscription here assumming the HOST:SUBSCRIPTION PATTERN MATCHES.
    if (hostname === shellHostname && topic === shellTopic) {
      // TOME: Need to de-serialize the data here? May be better elsewhere, since you have to think about error message.
      eventEmitter.emit('data', shellMessage)
    }
  })
  return eventEmitter
}

// TOME: Here is an example pattern. The actual on 'data' never changes.
// const eventEmitter = appShellListener('cat')
// eventEmitter.on('data', data => {
//   console.log(data)
// })

// const eventEmitterTwo = appShellListener('dog')
// eventEmitterTwo.on('data', data => {
//   console.log(data)
// })
