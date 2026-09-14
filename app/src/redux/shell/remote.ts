// access main process remote modules via attachments to `global`
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type {
  IPCSafeFormData,
  NotifyResponseData,
  NotifyTopic,
  Remote,
} from './types'

const emptyRemote: Remote = {} as any

export const remote: Remote = new Proxy(emptyRemote, {
  get(_target, propName: string): unknown {
    console.assert(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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

// FormData and File objects can't be sent through invoke().
// This converts them into simpler objects that can be.
// app-shell will convert them back.
async function proxyFormData(formData: FormData): Promise<IPCSafeFormData> {
  const result: IPCSafeFormData = []
  for (const [name, value] of formData.entries()) {
    if (value instanceof File) {
      result.push({
        type: 'file',
        name,
        // todo(mm, 2024-04-24): Send just the (full) filename instead of the file
        // contents, to avoid the IPC message ballooning into several MB.
        value: await value.arrayBuffer(),
        filename: value.name,
      })
    } else {
      result.push({ type: 'string', name, value })
    }
  }

  return result
}

async function doAppShellRequest<Data>(
  target: 'usb:request' | 'internal-api:request',
  config: AxiosRequestConfig
): Promise<AxiosResponse<Data>> {
  const { data } = config
  const formDataProxy =
    data instanceof FormData
      ? { proxiedFormData: await proxyFormData(data) }
      : data
  const configProxy = { ...config, data: formDataProxy }

  const result = await remote.ipcRenderer.invoke(target, configProxy)
  if (result?.error != null) {
    throw result.error
  }

  // TODO(jh, 2026-02-26): The below is a hack to get around the fact that Blob data
  // doesn't (de)serialize properly somewhere in the IPC chain, seemingly only on Windows. Investigate
  // a more robust solution.

  // Blob data doesn't serialize properly across the IPC, so we parse it from
  // an Array type sent from the shell layer. On Windows, large arrays may be
  // serialized as objects with numeric string keys (e.g., {"0":80,"1":75,...}).
  if (config.responseType === 'blob' && result.data != null) {
    const arrayData = Array.isArray(result.data)
      ? result.data
      : Object.values(result.data as Record<string, number>)

    result.data = new Blob([new Uint8Array(arrayData as number[])]) as Data
  }

  return result
}

export async function appShellInternalApiRequestor<Data>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<Data>> {
  return await doAppShellRequest('internal-api:request', config)
}

export async function appShellUSBRequestor<Data>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<Data>> {
  return await doAppShellRequest('usb:request', config)
}

interface CallbackStore {
  [hostname: string]: {
    [topic in NotifyTopic]: Array<(data: NotifyResponseData) => void>
  }
}
const callbackStore: CallbackStore = {}

interface AppShellListener {
  hostname: string
  notifyTopic: NotifyTopic
  callback: (data: NotifyResponseData) => void
  isDismounting?: boolean
}
export function appShellListener({
  hostname,
  notifyTopic,
  callback,
  isDismounting = false,
}: AppShellListener): CallbackStore {
  // The shell emits general messages to ALL_TOPICS, typically errors, and all listeners must handle those messages.
  const topics: NotifyTopic[] = [notifyTopic, 'ALL_TOPICS'] as const

  topics.forEach(topic => {
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
  })

  return callbackStore
}
// Instantiate the notify listener at runtime.
remote.ipcRenderer.on(
  'notify',
  (_, shellHostname, shellTopic, shellMessage) => {
    callbackStore[shellHostname]?.[shellTopic]?.forEach(cb => {
      cb(shellMessage)
    })
  }
)

export async function saveFileToUsb(
  filePath: string,
  buffer: ArrayBuffer
): Promise<void> {
  await remote.ipcRenderer.invoke('usb:saveFile', {
    filePath,
    buffer: Array.from(new Uint8Array(buffer)),
  })
}

export async function tryInstallEncryptedRobotCertificate(props: {
  certificateData: string
  password: string
  salt: string
  iterations: number
}): Promise<boolean> {
  return await remote.ipcRenderer.invoke('robot-cert:install-encrypted', props)
}

export async function tryInstallPlaintextRobotCertificate(props: {
  certificateData: string
}): Promise<boolean> {
  return await remote.ipcRenderer.invoke('robot-cert:install-plaintext', props)
}

interface RobotUpdateUploadPayload {
  ip: string
  port: number | null
  name: string
  robotModel?: string | null
  path: string
  systemFile: string
  userNotes?: string
  token?: string | null
  secure?: boolean
}

export function uploadRobotUpdateFileViaShell(
  payload: RobotUpdateUploadPayload
): Promise<{ ok: true }> {
  return remote.ipcRenderer.invoke('robot-update:upload', payload)
}
