// system-info actions

import * as Constants from './constants'
import * as Types from './types'

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
