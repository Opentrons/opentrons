// @flow
// system-info actions

import * as Constants from './constants'
import * as Types from './types'

// TODO(mc, 2020-04-17): add other system info
export const initialized = (
  usbDevices: Array<Types.UsbDevice>
): Types.InitializedAction => ({
  type: Constants.INITIALIZED,
  payload: { usbDevices },
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
