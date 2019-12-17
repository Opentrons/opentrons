// @flow

import * as Constants from './constants'

import type { Action } from '../types'
import type { RobotControlsState, PerRobotControlsState } from './types'

const INITIAL_STATE: RobotControlsState = {}

const INITIAL_CONTROLS_STATE: PerRobotControlsState = {
  lightsOn: null,
}

export function robotControlsReducer(
  state: RobotControlsState = INITIAL_STATE,
  action: Action
): RobotControlsState {
  switch (action.type) {
    case Constants.FETCH_LIGHTS_SUCCESS:
    case Constants.UPDATE_LIGHTS_SUCCESS: {
      const { robotName, lightsOn } = action.payload
      const robotState = state[robotName] || INITIAL_CONTROLS_STATE

      return {
        ...state,
        [robotName]: { ...robotState, lightsOn },
      }
    }
  }

  return state
}
