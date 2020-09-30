// @flow
// system-info actions

import * as Constants from './constants'
import * as Types from './types'

export const initialized = (
  usbDevices: Array<Types.UsbDevice>,
  networkInterfaces: Array<Types.NetworkInterface>
): Types.InitializedAction => ({
  type: Constants.INITIALIZED,
  payload: { usbDevices, networkInterfaces },
})

export const usbDeviceAdded = (
  usbDevice: Types.UsbDevice
): Types.UsbDeviceAddedAction => ({
  type: Constants.USB_DEVICE_ADDED,
  payload: { usbDevice },
})

export const usbDeviceRemoved = (
  usbDevice: Types.UsbDevice
): Types.UsbDeviceRemovedAction => ({
  type: Constants.USB_DEVICE_REMOVED,
  payload: { usbDevice },
})

export const networkInterfacesChanged = (
  networkInterfaces: Array<Types.NetworkInterface>
): Types.NetworkInterfacesChangedAction => ({
  type: Constants.NETWORK_INTERFACES_CHANGED,
  payload: { networkInterfaces },
})
