// @flow
// system-info reducer

import * as Constants from './constants'

import type { Action } from '../types'
import type { SystemInfoState } from './types'

const INITIAL_STATE: SystemInfoState = {
  usbDevices: [],
}

export function systemInfoReducer(
  state: SystemInfoState = INITIAL_STATE,
  action: Action
): SystemInfoState {
  switch (action.type) {
    case Constants.INITIALIZED: {
      return { ...state, usbDevices: action.payload.usbDevices }
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
  }

  return state
}
