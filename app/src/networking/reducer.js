// @flow

import * as Constants from './constants'

import type { Action } from '../types'
import type { NetworkingState, PerRobotNetworkingState } from './types'

const INITIAL_STATE: NetworkingState = {}
const INITIAL_ROBOT_STATE: PerRobotNetworkingState = {}

export function networkingReducer(
  state: NetworkingState = INITIAL_STATE,
  action: Action
): NetworkingState {
  switch (action.type) {
    case Constants.FETCH_STATUS_SUCCESS: {
      const { robotName, internetStatus, interfaces } = action.payload
      const robotState = state[robotName] || INITIAL_ROBOT_STATE

      return {
        ...state,
        [robotName]: { ...robotState, internetStatus, interfaces },
      }
    }
  }

  return state
}
