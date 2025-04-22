import * as Constants from './constants'
import * as pipetteOffset from './pipette-offset'
import * as tipLength from './tip-length'

import type { Reducer } from 'redux'
import type { Action } from '../types'
import type { CalibrationState, PerRobotCalibrationState } from './types'

const INITIAL_STATE: CalibrationState = {}

const INITIAL_PER_ROBOT_STATE: PerRobotCalibrationState = {
  calibrationStatus: null,
  pipetteOffsetCalibrations: null,
  tipLengthCalibrations: null,
}

export const calibrationReducer: Reducer<CalibrationState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case Constants.FETCH_CALIBRATION_STATUS_SUCCESS: {
      const { robotName, calibrationStatus } = action.payload
      const robotState = state[robotName] ?? INITIAL_PER_ROBOT_STATE

      return { ...state, [robotName]: { ...robotState, calibrationStatus } }
    }

    case pipetteOffset.FETCH_PIPETTE_OFFSET_CALIBRATIONS_SUCCESS: {
      const { robotName, pipetteOffsetCalibrations } = action.payload
      const robotState = state[robotName] ?? INITIAL_PER_ROBOT_STATE

      return {
        ...state,
        [robotName]: { ...robotState, pipetteOffsetCalibrations },
      }
    }

    case tipLength.FETCH_TIP_LENGTH_CALIBRATIONS_SUCCESS: {
      const { robotName, tipLengthCalibrations } = action.payload
      const robotState = state[robotName] ?? INITIAL_PER_ROBOT_STATE

      return {
        ...state,
        [robotName]: { ...robotState, tipLengthCalibrations },
      }
    }
  }
  return state
}
