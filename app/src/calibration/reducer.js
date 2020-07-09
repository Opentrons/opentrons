// @flow
import * as Constants from './constants'
import { constants as LabwareConstants } from './labware'

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
      const { robotName, labwareCalibration } = action.payload
      return {
        ...state,
        [robotName]: {
          ...(state[robotName] ?? {}),
          labwareCalibration,
        },
      }
    }
  }
  return state
}
