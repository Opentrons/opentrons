// system-info reducer

import * as Constants from './constants'

import type { Reducer } from 'redux'
import type { Action } from '../types'
import type { SystemInfoState } from './types'

const INITIAL_STATE: SystemInfoState = {
  usbDevices: [],
  networkInterfaces: [],
}

export const systemInfoReducer: Reducer<SystemInfoState, Action> = (
  state = INITIAL_STATE,
  action
) => {
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
      const { identifier } = action.payload.usbDevice
      return {
        ...state,
        usbDevices: state.usbDevices.filter(d => d.identifier !== identifier),
      }
    }

    case Constants.NETWORK_INTERFACES_CHANGED: {
      return { ...state, networkInterfaces: action.payload.networkInterfaces }
    }
  }

  return state
}
