// access main process remote modules via attachments to `global`
import type { AxiosRequestConfig } from 'axios'
import type { ResponsePromise } from '@opentrons/api-client'
import type { Remote, NotifyTopic, NotifyResponseData } from './types'

const emptyRemote: Remote = {} as any

export const remote: Remote = new Proxy(emptyRemote, {
  get(_target, propName: string): unknown {
    console.assert(
      (global as any).APP_SHELL_REMOTE,
      'Expected APP_SHELL_REMOTE to be attached to global scope; is app-shell/src/preload.ts properly configured?'
    )

    console.assert(
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

interface CallbackStore {
  [hostname: string]: {
    [topic in NotifyTopic]: Array<(data: NotifyResponseData) => void>
  }
}
const callbackStore: CallbackStore = {}

interface AppShellListener {
  hostname: string
  topic: NotifyTopic
  callback: (data: NotifyResponseData) => void
  isDismounting?: boolean
}
export function appShellListener({
  hostname,
  topic,
  callback,
  isDismounting = false,
}: AppShellListener): CallbackStore {
  if (isDismounting) {
    const callbacks = callbackStore[hostname]?.[topic]
    if (callbacks != null) {
      callbackStore[hostname][topic] = callbacks.filter(cb => cb !== callback)
      if (!callbackStore[hostname][topic].length) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete callbackStore[hostname][topic]
        if (!Object.keys(callbackStore[hostname]).length) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete callbackStore[hostname]
        }
      }
    }
  } else {
    callbackStore[hostname] = callbackStore[hostname] ?? {}
    callbackStore[hostname][topic] ??= []
    callbackStore[hostname][topic].push(callback)
  }
  return callbackStore
}

// Instantiate the notify listener at runtime.
remote.ipcRenderer.on(
  'notify',
  (_, shellHostname, shellTopic, shellMessage) => {
    callbackStore[shellHostname]?.[shellTopic]?.forEach(cb => cb(shellMessage))
  }
)
