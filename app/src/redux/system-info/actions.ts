// system-info actions

import { createLogger } from '/app/logger'
import { remote } from '/app/redux/shell/remote'

import * as Constants from './constants'

import type { ThunkPromiseAction } from '../types'
import type * as Types from './types'

interface AppShellUsbDevice {
  id: string
  product: string
  manufacturer?: string | null
  vendorId?: string | null
  productId?: string | null
  serialNumber?: string | null
  location: string
  sysName: string
}

const log = createLogger(new URL('', import.meta.url).pathname)

const parseHexId = (value: string | null | undefined): number | null => {
  if (value == null || value === '') return null

  const parsed = Number.parseInt(value, 16)
  return Number.isNaN(parsed) ? null : parsed
}

const normalizeUsbDevice = (device: AppShellUsbDevice): Types.UsbDevice => ({
  identifier: device.id,
  systemIdentifier: device.sysName,
  productName: device.product,
  manufacturerName: device.manufacturer ?? null,
  vendorId: parseHexId(device.vendorId),
  productId: parseHexId(device.productId),
  serialNumber: device.serialNumber ?? null,
  location: device.location,
})

export const initialized = (
  usbDevices: Types.UsbDevice[],
  networkInterfaces: Types.NetworkInterface[]
): Types.InitializedAction => ({
  type: Constants.INITIALIZED,
  payload: { usbDevices, networkInterfaces },
  meta: { shell: true },
})

export const usbDeviceAdded = (
  usbDevice: Types.UsbDevice
): Types.UsbDeviceAddedAction => ({
  type: Constants.USB_DEVICE_ADDED,
  payload: { usbDevice },
  meta: { shell: true },
})

export const usbDeviceRemoved = (
  usbDevice: Types.UsbDevice
): Types.UsbDeviceRemovedAction => ({
  type: Constants.USB_DEVICE_REMOVED,
  payload: { usbDevice },
  meta: { shell: true },
})

export const networkInterfacesChanged = (
  networkInterfaces: Types.NetworkInterface[]
): Types.NetworkInterfacesChangedAction => ({
  type: Constants.NETWORK_INTERFACES_CHANGED,
  payload: { networkInterfaces },
})

export const fetchUsbDevices = (): ThunkPromiseAction => {
  return async (dispatch, getState) => {
    try {
      const response = await remote.ipcRenderer.invoke('usb:getDevices')
      const usbDevices = Array.isArray(response)
        ? response.map(device =>
            normalizeUsbDevice(device as AppShellUsbDevice)
          )
        : []

      return dispatch(
        initialized(usbDevices, getState().systemInfo.networkInterfaces)
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error)

      log.error(`Failed to fetch USB devices from app shell: ${message}`)
      return null
    }
  }
}
