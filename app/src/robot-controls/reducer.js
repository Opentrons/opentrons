// @flow

import type { Action } from '../types'
import * as Constants from './constants'

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

    case Constants.HOME:
    case Constants.MOVE: {
      const { robotName } = action.payload
      return updateRobotState(state, robotName, {
        movementStatus:
          action.type === Constants.HOME ? Constants.HOMING : Constants.MOVING,
        movementError: null,
      })
    }

    case Constants.HOME_SUCCESS:
    case Constants.MOVE_SUCCESS:
    case Constants.CLEAR_MOVEMENT_STATUS: {
      const { robotName } = action.payload
      return updateRobotState(state, robotName, {
        movementStatus: null,
        movementError: null,
      })
    }

    case Constants.HOME_FAILURE:
    case Constants.MOVE_FAILURE: {
      const { robotName, error } = action.payload
      return updateRobotState(state, robotName, {
        movementStatus:
          action.type === Constants.HOME_FAILURE
            ? Constants.HOME_ERROR
            : Constants.MOVE_ERROR,
        movementError: error.message,
      })
    }
  }

  return state
}
