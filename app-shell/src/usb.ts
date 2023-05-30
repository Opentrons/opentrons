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

export function getSerialPortHttpAgent(): SerialPortHttpAgent | undefined {
  return usbHttpAgent
}

export function createSerialPortHttpAgent(path: string): void {
  const serialPortHttpAgent = new SerialPortHttpAgent({
    maxFreeSockets: 1,
    maxSockets: 1,
    maxTotalSockets: 1,
    keepAlive: true,
    keepAliveMsecs: 10000,
    path,
    logger: usbLog,
  })

  usbHttpAgent = serialPortHttpAgent
}

export function destroyUsbHttpAgent(): void {
  if (usbHttpAgent != null) {
    usbHttpAgent.destroy()
  }
  usbHttpAgent = undefined
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
  try {
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

    const response = await axios.request({
      httpAgent: usbHttpAgent,
      ...config,
      data,
      headers: { ...config.headers, ...formHeaders },
    })
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    }
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    usbLog.debug(`usbListener error ${e?.message ?? 'unknown'}`)
  }
}

function startUsbHttpRequests(dispatch: Dispatch): void {
  fetchSerialPortList()
    .then((list: PortInfo[]) => {
      const ot3UsbSerialPort = list.find(
        port =>
          port.productId === DEFAULT_PRODUCT_ID &&
          port.vendorId === DEFAULT_VENDOR_ID
      )

      // retry if no OT-3 serial port found - usb-detection and serialport packages have race condition
      if (ot3UsbSerialPort == null) {
        usbLog.debug('no OT-3 serial port found, retrying')
        setTimeout(() => startUsbHttpRequests(dispatch), 1000)
        return
      }

      createSerialPortHttpAgent(ot3UsbSerialPort.path)
      // remove any existing handler
      ipcMain.removeHandler('usb:request')
      ipcMain.handle('usb:request', usbListener)

      dispatch(usbRequestsStart())
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
          startUsbHttpRequests(dispatch)
        }
        break
      case USB_DEVICE_ADDED:
        if (isUsbDeviceOt3(action.payload.usbDevice)) {
          startUsbHttpRequests(dispatch)
        }
        break
      case USB_DEVICE_REMOVED:
        if (isUsbDeviceOt3(action.payload.usbDevice)) {
          destroyUsbHttpAgent()
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
        break
    }
  }
}
