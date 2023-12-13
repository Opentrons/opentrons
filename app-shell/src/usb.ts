import { ipcMain, IpcMainInvokeEvent } from 'electron'
import axios, { AxiosRequestConfig } from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

import {
  usbRequestsStart,
  usbRequestsStop,
} from '@opentrons/app/src/redux/shell'
import {
  INITIALIZED as SYSTEM_INFO_INITIALIZED,
  USB_DEVICE_ADDED,
  USB_DEVICE_REMOVED,
} from '@opentrons/app/src/redux/system-info/constants'
import {
  fetchSerialPortList,
  SerialPortHttpAgent,
  DEFAULT_PRODUCT_ID,
  DEFAULT_VENDOR_ID,
} from '@opentrons/usb-bridge/node-client'

import { createLogger } from './log'
import { getProtocolSrcFilePaths } from './protocol-storage'

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
async function usbListener(
  _event: IpcMainInvokeEvent,
  config: AxiosRequestConfig
): Promise<unknown> {
  // TODO(bh, 2023-05-03): remove mutation
  let { data } = config
  let formHeaders = {}

  // check for formDataProxy
  if (data?.formDataProxy != null) {
    // reconstruct FormData
    const formData = new FormData()
    const { protocolKey } = data.formDataProxy

    const srcFilePaths: string[] = await getProtocolSrcFilePaths(protocolKey)

    // create readable stream from file
    srcFilePaths.forEach(srcFilePath => {
      const readStream = fs.createReadStream(srcFilePath)
      formData.append('files', readStream, path.basename(srcFilePath))
    })

    formData.append('key', protocolKey)

    formHeaders = formData.getHeaders()
    data = formData
  }

  const usbHttpAgent = getSerialPortHttpAgent()
  try {
    const response = await axios.request({
      httpAgent: usbHttpAgent,
      ...config,
      data,
      headers: { ...config.headers, ...formHeaders },
    })
    return {
      error: false,
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    }
  } catch (e) {
    console.log(`axios request error ${e?.message ?? 'unknown'}`)
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

      // retry if no OT-3 serial port found - usb-detection and serialport packages have race condition
      if (ot3UsbSerialPort == null) {
        usbLog.debug('no OT-3 serial port found')
        return
      }
      if (usbHttpAgent == null) {
        createSerialPortHttpAgent(ot3UsbSerialPort.path, (err, agent?) => {
          if (err) {
            const message = err?.message ?? err
            usbLog.error(`Failed to create serial port: ${message}`)
          }
          if (agent) {
            ipcMain.removeHandler('usb:request')
            ipcMain.handle('usb:request', usbListener)
            dispatch(usbRequestsStart())
          }
        })
      }
    })
    .catch(e =>
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
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
