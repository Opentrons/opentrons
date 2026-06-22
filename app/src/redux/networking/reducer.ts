import * as Constants from './constants'

import type { Reducer } from 'redux'
import type { Action } from '../types'
import type { NetworkingState, PerRobotNetworkingState } from './types'

const INITIAL_STATE: NetworkingState = {}
const INITIAL_ROBOT_STATE: PerRobotNetworkingState = {}

const getRobotState = (
  state: NetworkingState,
  robotName: string
): PerRobotNetworkingState => state[robotName] || INITIAL_ROBOT_STATE

const getWifiInterfaceKey = (
  networkingState: PerRobotNetworkingState
): string => {
  const networkInterfacesEntries = Object.entries(
    networkingState.interfaces ?? {}
  )
  const wifiInterfaceEntry = networkInterfacesEntries.find(
    networkInterface => networkInterface[1]?.type === Constants.INTERFACE_WIFI
  )
  const wifiInterfaceKey = wifiInterfaceEntry?.[0]

  // default to 'mlan0' for type safety
  return wifiInterfaceKey ?? 'mlan0'
}

export const networkingReducer: Reducer<NetworkingState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case Constants.FETCH_STATUS_SUCCESS: {
      const { robotName, internetStatus, interfaces } = action.payload
      const robotState = getRobotState(state, robotName)

      return {
        ...state,
        [robotName]: { ...robotState, internetStatus, interfaces },
      }
    }

    case Constants.FETCH_EAP_OPTIONS_SUCCESS: {
      const { robotName, eapOptions } = action.payload
      const robotState = getRobotState(state, robotName)

      return {
        ...state,
        [robotName]: { ...robotState, eapOptions },
      }
    }

    case Constants.CLEAR_WIFI_STATUS: {
      const { robotName } = action.payload
      const robotState = getRobotState(state, robotName)
      const wifiInterfaceKey = getWifiInterfaceKey(robotState)
      return {
        ...state,
        [robotName]: {
          ...robotState,
          interfaces: {
            ...robotState.interfaces,
            [wifiInterfaceKey]: {
              ipAddress: null,
              macAddress: 'unknown',
              gatewayAddress: null,
              state: 'disconnected',
              type: Constants.INTERFACE_WIFI,
            },
          },
        },
      }
    }
  }

  return state
}
