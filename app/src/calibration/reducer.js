// @flow
import * as Constants from './constants'
import * as LabwareConstants from './labware/constants'

import type { Action } from '../types'
import type { CalibrationState } from './types'

const INITIAL_STATE: CalibrationState = {}

export function calibrationReducer(
  state: CalibrationState = INITIAL_STATE,
  action: Action
): CalibrationState {
  switch (action.type) {
    case Constants.FETCH_CALIBRATION_STATUS_SUCCESS: {
      const { robotName, calibrationStatus } = action.payload
      return {
        ...state,
        [robotName]: {
          ...(state[robotName] ?? {}),
          calibrationStatus,
        },
      }
    }
    case LabwareConstants.FETCH_LABWARE_CALIBRATION_SUCCESS: {
      const { robotName, labwareCalibrations } = action.payload
      return {
        ...state,
        [robotName]: {
          ...(state[robotName] ?? {}),
          labwareCalibrations,
        },
      }
    }
    // create new action type of labware calibration
    // don't follow exactly above because it would delete cal status.
  }
  return state
}
