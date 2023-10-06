import intersection from 'lodash/intersection'
import keyBy from 'lodash/keyBy'
import union from 'lodash/union'
import uniq from 'lodash/uniq'

import * as Constants from './constants'

import type { Action } from '../types'
import type { NetworkingState, PerRobotNetworkingState } from './types'
import { Reducer } from 'redux'

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

    case Constants.FETCH_WIFI_KEYS_SUCCESS: {
      const { robotName, wifiKeys } = action.payload
      const robotState = getRobotState(state, robotName)
      const existingIds = robotState.wifiKeyIds ?? []
      const newIds = wifiKeys.map(k => k.id)
      // preserve order of existingIds while removing items not in newIds
      const wifiKeyIds = union(intersection(existingIds, newIds), newIds)
      const wifiKeysById = keyBy(wifiKeys, 'id')

      return {
        ...state,
        [robotName]: { ...robotState, wifiKeyIds, wifiKeysById },
      }
    }

    case Constants.POST_WIFI_KEYS_SUCCESS: {
      const { robotName, wifiKey: apiWifiKey } = action.payload
      const { requestId } = action.meta
      const wifiKey = requestId ? { ...apiWifiKey, requestId } : apiWifiKey
      const robotState = getRobotState(state, robotName)
      const wifiKeyIds = uniq([...(robotState.wifiKeyIds ?? []), wifiKey.id])
      const wifiKeysById = { ...robotState.wifiKeysById, [wifiKey.id]: wifiKey }

      return {
        ...state,
        [robotName]: { ...robotState, wifiKeyIds, wifiKeysById },
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
