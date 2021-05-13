// @flow
import intersection from 'lodash/intersection'
import keyBy from 'lodash/keyBy'
import union from 'lodash/union'
import uniq from 'lodash/uniq'

import * as Constants from './constants'

import type { Action } from '../types'
import type { NetworkingState, PerRobotNetworkingState } from './types'

const INITIAL_STATE: NetworkingState = {}
const INITIAL_ROBOT_STATE: PerRobotNetworkingState = {}

const getRobotState = (
  state: NetworkingState,
  robotName: string
): PerRobotNetworkingState => state[robotName] || INITIAL_ROBOT_STATE

export function networkingReducer(
  state: NetworkingState = INITIAL_STATE,
  action: Action
): NetworkingState {
  switch (action.type) {
    case Constants.FETCH_STATUS_SUCCESS: {
      const { robotName, internetStatus, interfaces } = action.payload
      const robotState = getRobotState(state, robotName)

      return {
        ...state,
        [robotName]: { ...robotState, internetStatus, interfaces },
      }
    }

    case Constants.FETCH_WIFI_LIST_SUCCESS: {
      const { robotName, wifiList } = action.payload
      const robotState = getRobotState(state, robotName)

      return {
        ...state,
        [robotName]: { ...robotState, wifiList },
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
  }

  return state
}
