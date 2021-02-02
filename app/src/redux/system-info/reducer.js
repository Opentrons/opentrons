// @flow
// system-info reducer

import * as Constants from './constants'

import type { Action } from '../types'
import type { SystemInfoState } from './types'

const INITIAL_STATE: SystemInfoState = {
  usbDevices: [],
  networkInterfaces: [],
}

export function systemInfoReducer(
  state: SystemInfoState = INITIAL_STATE,
  action: Action
): SystemInfoState {
  switch (action.type) {
    case Constants.INITIALIZED: {
      const { usbDevices, networkInterfaces } = action.payload
      return { ...state, usbDevices, networkInterfaces }
    }

    case Constants.USB_DEVICE_ADDED: {
      return {
        ...state,
        usbDevices: [...state.usbDevices, action.payload.usbDevice],
      }
    }

    case Constants.USB_DEVICE_REMOVED: {
      const { vendorId, productId, serialNumber } = action.payload.usbDevice
      return {
        ...state,
        usbDevices: state.usbDevices.filter(d => {
          return (
            d.vendorId !== vendorId ||
            d.productId !== productId ||
            d.serialNumber !== serialNumber
          )
        }),
      }
    }

    case Constants.NETWORK_INTERFACES_CHANGED: {
      return { ...state, networkInterfaces: action.payload.networkInterfaces }
    }
  }

  return state
}
