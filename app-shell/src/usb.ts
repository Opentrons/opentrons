import { ipcMain } from 'electron'
import FormData from 'form-data'
import fetch from 'node-fetch'

import { HttpClientError } from '@opentrons/api-client'
import {
  DEFAULT_PRODUCT_ID,
  DEFAULT_VENDOR_ID,
  fetchSerialPortList,
  SerialPortHttpAgent,
} from '@opentrons/usb-bridge/node-client'

import { usbRequestsStart, usbRequestsStop } from './config/actions'
import {
  SYSTEM_INFO_INITIALIZED,
  USB_DEVICE_ADDED,
  USB_DEVICE_REMOVED,
} from './constants'
import { createLogger } from './log'

import type { IpcMainInvokeEvent } from 'electron'
import type { BodyInit as NodeFetchBodyInit } from 'node-fetch'
import type { HttpRequestConfig, HttpResponse } from '@opentrons/api-client'
import type { IPCSafeFormData } from '@opentrons/app/src/redux/shell/types'
import type { UsbDevice } from '@opentrons/app/src/redux/system-info/types'
import type { PortInfo } from '@opentrons/usb-bridge/node-client'
import type { Action, Dispatch } from './types'

let usbHttpAgent: SerialPortHttpAgent | undefined
const usbLog = createLogger('usb')
let usbFetchInterval: NodeJS.Timeout

export function getSerialPortHttpAgent(): SerialPortHttpAgent | undefined {
  return usbHttpAgent
}
export function createSerialPortHttpAgent(
  path: string,
  onComplete: (err: Error | null, agent?: SerialPortHttpAgent) => void
): void {
  if (usbHttpAgent != null) {
    onComplete(
      new Error('Tried to make a USB http agent when one already existed')
    )
  } else {
    usbHttpAgent = new SerialPortHttpAgent(
      {
        maxFreeSockets: 1,
        maxSockets: 1,
        maxTotalSockets: 1,
        keepAlive: true,
        keepAliveMsecs: Infinity,
        path,
        logger: usbLog,
        timeout: 100000,
      },
      (err, agent?) => {
        if (err != null) {
          usbHttpAgent = undefined
        }
        onComplete(err, agent)
      }
    )
  }
}

export function destroyAndStopUsbHttpRequests(dispatch: Dispatch): void {
  if (usbHttpAgent != null) {
    usbHttpAgent.destroy()
  }
  usbHttpAgent = undefined
  ipcMain.removeHandler('usb:request')
  dispatch(usbRequestsStop())
  // handle any additional invocations of usb:request
  ipcMain.handle('usb:request', () =>
    Promise.resolve({
      status: 400,
      statusText: 'USB robot disconnected',
    })
  )
}

function isUsbDeviceOt3(device: UsbDevice): boolean {
  return (
    device.productId === parseInt(DEFAULT_PRODUCT_ID, 16) &&
    device.vendorId === parseInt(DEFAULT_VENDOR_ID, 16)
  )
}

function reconstructFormData(ipcSafeFormData: IPCSafeFormData): FormData {
  const result = new FormData()
  ipcSafeFormData.forEach(entry => {
    entry.type === 'file'
      ? result.append(entry.name, Buffer.from(entry.value), entry.filename)
      : result.append(entry.name, entry.value)
  })
  return result
}

const cloneError = (
  e: HttpClientError | Record<string, unknown>
): Record<string, unknown> =>
  Object.entries(
    'toJSON' in e && typeof e.toJSON === 'function'
      ? (e.toJSON() as Record<string, unknown>)
      : e
  ).reduce<Record<string, unknown>>((acc, [k, v]) => {
    try {
      acc[k] = structuredClone(v)
      return acc
    } catch (e) {
      return acc
    }
  }, {})

async function parseResponseData(
  response: Awaited<ReturnType<typeof fetch>>,
  responseType?: HttpRequestConfig['responseType']
): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return undefined
  }

  if (responseType === 'blob' || responseType === 'arrayBuffer') {
    return await response.arrayBuffer()
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (
    responseType === 'json' ||
    contentType.includes('application/json') ||
    contentType.includes('+json')
  ) {
    return await response.json()
  }

  return await response.text()
}

async function usbListener(
  _event: IpcMainInvokeEvent,
  config: HttpRequestConfig
): Promise<unknown> {
  // TODO(bh, 2023-05-03): remove mutation
  let { data } = config
  let formHeaders = {}
  const proxiedData =
    data != null && typeof data === 'object'
      ? (data as { proxiedFormData?: IPCSafeFormData })
      : null

  // check for formDataProxy
  if (proxiedData?.proxiedFormData != null) {
    // reconstruct FormData
    const formData = reconstructFormData(proxiedData.proxiedFormData)
    formHeaders = formData.getHeaders()
    data = formData
  }

  const usbHttpAgent = getSerialPortHttpAgent()
  try {
    usbLog.silly(`${config.method} ${config.url} timeout=${config.timeout}`)
    const response = await fetch(config.url ?? '', {
      method: config.method,
      headers: { ...config.headers, ...formHeaders },
      body: (data ?? undefined) as NodeFetchBodyInit | undefined,
      agent: usbHttpAgent,
    })
    const parsedData = await parseResponseData(response, config.responseType)
    const normalizedResponse: HttpResponse<unknown> = {
      config,
      data: parsedData,
      headers: Object.fromEntries(response.headers.entries()),
      status: response.status,
      statusText: response.statusText,
    }

    if (!response.ok) {
      const httpClientError: HttpClientError = new HttpClientError({
        config,
        message: `Request failed with status code ${response.status}`,
        response: normalizedResponse,
      })
      throw httpClientError
    }
    usbLog.silly(`${config.method} ${config.url} resolved ok`)

    // Convert ArrayBuffer to regular Array for IPC transfer, since ArrayBuffer
    //  objects cannot be sent across the IPC reliably.
    const responseData =
      config.responseType === 'blob' && parsedData instanceof ArrayBuffer
        ? Array.from(new Uint8Array(parsedData))
        : parsedData

    return {
      error: null,
      data: responseData,
      headers: normalizedResponse.headers,
      status: normalizedResponse.status,
      statusText: normalizedResponse.statusText,
      config,
    }
  } catch (e: unknown) {
    usbLog.info(`${config.method} ${config.url} failed: ${String(e)}`)
    return {
      error: cloneError(
        (typeof e === 'object' && e != null ? e : { message: String(e) }) as
          | HttpClientError
          | Record<string, unknown>
      ),
    }
  }
}

function pollSerialPortAndCreateAgent(dispatch: Dispatch): void {
  // usb poll already initialized
  if (usbFetchInterval != null) {
    return
  }
  usbFetchInterval = setInterval(() => {
    // already connected to an Opentrons robot via USB
    tryCreateAndStartUsbHttpRequests(dispatch)
  }, 10000)
}

function tryCreateAndStartUsbHttpRequests(dispatch: Dispatch): void {
  fetchSerialPortList()
    .then((list: PortInfo[]) => {
      const ot3UsbSerialPort = list.find(
        port =>
          port.productId?.localeCompare(DEFAULT_PRODUCT_ID, 'en-US', {
            sensitivity: 'base',
          }) === 0 &&
          port.vendorId?.localeCompare(DEFAULT_VENDOR_ID, 'en-US', {
            sensitivity: 'base',
          }) === 0
      )

      // retry if no Flex serial port found - usb-detection and serialport packages have race condition
      if (ot3UsbSerialPort == null) {
        usbLog.debug('No Flex serial port found.')
        return
      }
      if (usbHttpAgent == null) {
        createSerialPortHttpAgent(ot3UsbSerialPort.path, (err, agent?) => {
          if (err != null) {
            const message = err?.message ?? err
            usbLog.error(`Failed to create serial port: ${message}`)
          }
          if (agent != null) {
            ipcMain.removeHandler('usb:request')
            ipcMain.handle('usb:request', usbListener)
            dispatch(usbRequestsStart())
          }
        })
      }
    })
    .catch(e =>
      usbLog.debug(`fetchSerialPortList error ${e?.message ?? 'unknown'}`)
    )
}

export function registerUsb(dispatch: Dispatch): (action: Action) => unknown {
  return function handleIncomingAction(action: Action): void {
    switch (action.type) {
      case SYSTEM_INFO_INITIALIZED:
        if (action.payload.usbDevices.find(isUsbDeviceOt3) != null) {
          tryCreateAndStartUsbHttpRequests(dispatch)
        }
        pollSerialPortAndCreateAgent(dispatch)
        break
      case USB_DEVICE_ADDED:
        if (isUsbDeviceOt3(action.payload.usbDevice)) {
          tryCreateAndStartUsbHttpRequests(dispatch)
        }
        break
      case USB_DEVICE_REMOVED:
        if (isUsbDeviceOt3(action.payload.usbDevice)) {
          destroyAndStopUsbHttpRequests(dispatch)
        }
        break
    }
  }
}
