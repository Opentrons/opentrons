// @flow
import * as Constants from './constants'

import type { Action } from '../types'
import type { CalibrationState, PerRobotCalibrationState } from './types'

const INITIAL_STATE: CalibrationState = {}

const INITIAL_CALIBRATION_STATE: PerRobotCalibrationState = {
  robotCalibrationCheck: null,
}

export function calibrationReducer(
  state: CalibrationState = INITIAL_STATE,
  action: Action
): CalibrationState {
  switch (action.type) {
    case Constants.FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS: {
      const { robotName, ...sessionState } = action.payload
      const robotState = state[robotName] || INITIAL_CALIBRATION_STATE

      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotCalibrationCheck: sessionState,
        },
      }
    }

    case Constants.DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS: {
      const { robotName } = action.payload
      const robotState = state[robotName] || INITIAL_CALIBRATION_STATE

      return {
        ...state,
        [robotName]: {
          ...robotState,
          robotCalibrationCheck: null,
        },
      }
    }
  }

  return state
}
