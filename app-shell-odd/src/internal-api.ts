import { env } from 'node:process'
import axios from 'axios'
import { ipcMain } from 'electron'
import FormData from 'form-data'

import { createLogger } from './log'

import type { AxiosRequestConfig } from 'axios'
import type { IpcMainInvokeEvent } from 'electron'
import type { IPCSafeFormData } from '@opentrons/app/src/redux/shell/types'

const internalApiLog = createLogger('internal-api')

function reconstructFormData(ipcSafeFormData: IPCSafeFormData): FormData {
  const result = new FormData()
  ipcSafeFormData.forEach(entry => {
    entry.type === 'file'
      ? result.append(entry.name, Buffer.from(entry.value), entry.filename)
      : result.append(entry.name, entry.value)
  })
  return result
}

const cloneError = (e: any): Record<string, unknown> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  Object.entries(axios.isAxiosError(e) ? e.toJSON() : e).reduce<
    Record<string, unknown>
  >((acc, [k, v]) => {
    try {
      acc[k] = structuredClone(v)
      return acc
    } catch (e) {
      return acc
    }
  }, {})

const handleFormData = (
  config: AxiosRequestConfig
): { formHeaders: FormData.Headers; data: any | FormData } => {
  const { data } = config
  // check for formDataProxy
  if (data?.proxiedFormData != null) {
    // reconstruct FormData
    const formData = reconstructFormData(
      data.proxiedFormData as IPCSafeFormData
    )
    return { formHeaders: formData.getHeaders(), data: formData }
  }
  return { data, formHeaders: {} }
}

interface Hosts {
  'key-server': string
}
type InternalHost = keyof Hosts

const internalHosts: () => Hosts = () => ({
  'key-server':
    env.ODD_key_server_host ?? 'socket:///run/opentrons-key-server.sock',
})

const INTERNAL_ROUTES: Array<[RegExp, InternalHost]> = [
  [/^\/keys\/internal\/.*$/, 'key-server'],
]

const mapUrlToInternalRoute = (url: string): InternalHost | null =>
  INTERNAL_ROUTES.reduce(
    (acc: InternalHost | null, [matcher, host]) =>
      matcher.test(url) ? host : acc,
    null
  )

const mapInternalRouteToAxiosDetails = (
  host: InternalHost
): { socketPath?: string; baseURL?: string; port?: string } => {
  const internalRoute = new URL(internalHosts()[host])
  if (internalRoute.protocol === 'socket:') {
    internalApiLog.silly(
      `mapped internal route for ${host} to socket path ${internalRoute}`
    )
    return { socketPath: internalRoute.pathname }
  }
  internalApiLog.silly(
    `mapped internal route for ${host} to port ${internalRoute.port} baseURL ${internalRoute.host}`
  )
  return { port: internalRoute.port, baseURL: 'http://' + internalRoute.host }
}

export const mapRequestToInternalConfig = (
  config: AxiosRequestConfig
): AxiosRequestConfig => {
  if (config.url == null) {
    throw new Error(`Internal API requests must have a URL`)
  }
  const internalRoute = mapUrlToInternalRoute(config.url)
  internalApiLog.silly(
    `Retrieved internal route ${internalRoute} for ${config.url}`
  )
  if (internalRoute == null) {
    throw new Error(`URL ${config.url} has no known internal API associated`)
  }
  return { ...config, ...mapInternalRouteToAxiosDetails(internalRoute) }
}

async function internalApiListener(
  _event: IpcMainInvokeEvent,
  config: AxiosRequestConfig
): Promise<unknown> {
  const { formHeaders, data } = handleFormData(config)
  internalApiLog.silly(`${config.method} ${config.baseURL} ${config.url}`)
  try {
    const mappedConfig = mapRequestToInternalConfig(config)
    internalApiLog.silly(
      `${config.method} (${config.baseURL}|${config.socketPath})${config.url} => ${mappedConfig.method} (${mappedConfig.baseURL}|${mappedConfig.socketPath})${mappedConfig.url} timeout=${config.timeout}`
    )
    const response = await axios.request({
      ...mappedConfig,
      data,
      headers: { ...mappedConfig.headers, ...formHeaders },
      // Axios can't create proper blob types on the node layer, so we use
      // arraybuffer instead.
      responseType:
        mappedConfig.responseType === 'blob'
          ? 'arraybuffer'
          : mappedConfig.responseType,
    })
    internalApiLog.silly(
      `${mappedConfig.method} ${mappedConfig.url} resolved ok`
    )

    // Convert ArrayBuffer to regular Array for IPC transfer, since ArrayBuffer
    //  objects cannot be sent across the IPC reliably.
    const responseData =
      mappedConfig.responseType === 'blob' &&
      response.data instanceof ArrayBuffer
        ? Array.from(new Uint8Array(response.data))
        : response.data

    return {
      error: null,
      data: responseData,
      status: response.status,
      statusText: response.statusText,
    }
  } catch (e: any) {
    internalApiLog.error(`${config.method} ${config.url} failed: ${e}`)
    return {
      error: cloneError(e),
    }
  }
}

export function registerInternalApiListener(): void {
  ipcMain.handle('internal-api:request', internalApiListener)
}
