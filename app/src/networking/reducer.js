// @flow

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
  }

  return state
}
