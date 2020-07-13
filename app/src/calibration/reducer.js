// @flow
import * as Constants from './constants'

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
      return { ...state, [robotName]: { calibrationStatus } }
    }
  }
  return state
}
