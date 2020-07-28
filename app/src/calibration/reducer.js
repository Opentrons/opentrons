// @flow
import * as Constants from './constants'
import * as labware from './labware'

import type { Action } from '../types'
import type { CalibrationState, PerRobotCalibrationState } from './types'

const INITIAL_STATE: CalibrationState = {}

const INITIAL_PER_ROBOT_STATE: PerRobotCalibrationState = {
  calibrationStatus: null,
  labwareCalibrations: null,
}

export function calibrationReducer(
  state: CalibrationState = INITIAL_STATE,
  action: Action
): CalibrationState {
  switch (action.type) {
    case Constants.FETCH_CALIBRATION_STATUS_SUCCESS: {
      const { robotName, calibrationStatus } = action.payload
      const robotState = state[robotName] ?? INITIAL_PER_ROBOT_STATE

      return { ...state, [robotName]: { ...robotState, calibrationStatus } }
    }

    case labware.FETCH_LABWARE_CALIBRATIONS_SUCCESS: {
      const { robotName, labwareCalibrations } = action.payload
      const robotState = state[robotName] ?? INITIAL_PER_ROBOT_STATE

      return { ...state, [robotName]: { ...robotState, labwareCalibrations } }
    }
  }
  return state
}
