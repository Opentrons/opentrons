// @flow

import * as Constants from './constants'

import type { Action } from '../types'
import type { RobotControlsState, PerRobotControlsState } from './types'

const INITIAL_STATE: RobotControlsState = {}

const INITIAL_CONTROLS_STATE: PerRobotControlsState = {
  lightsOn: null,
  movementStatus: null,
  movementError: null,
}

const updateRobotState = (
  state: RobotControlsState,
  robotName: string,
  update: $Shape<PerRobotControlsState>
): RobotControlsState => {
  const robotState = state[robotName] || INITIAL_CONTROLS_STATE

  return {
    ...state,
    [robotName]: { ...robotState, ...update },
  }
}

export function robotControlsReducer(
  state: RobotControlsState = INITIAL_STATE,
  action: Action
): RobotControlsState {
  switch (action.type) {
    case Constants.FETCH_LIGHTS_SUCCESS:
    case Constants.UPDATE_LIGHTS_SUCCESS: {
      const { robotName, lightsOn } = action.payload
      return updateRobotState(state, robotName, { lightsOn })
    }

    case Constants.HOME: {
      const { robotName } = action.payload
      return updateRobotState(state, robotName, {
        movementStatus: Constants.HOMING,
        movementError: null,
      })
    }

    case Constants.HOME_SUCCESS:
    case Constants.CLEAR_MOVEMENT_STATUS: {
      const { robotName } = action.payload
      return updateRobotState(state, robotName, {
        movementStatus: null,
        movementError: null,
      })
    }

    case Constants.HOME_FAILURE: {
      const { robotName, error } = action.payload
      return updateRobotState(state, robotName, {
        movementStatus: Constants.HOME_ERROR,
        movementError: error.message,
      })
    }
  }

  return state
}
