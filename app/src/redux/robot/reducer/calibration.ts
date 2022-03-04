// robot calibration state and reducer
// TODO(mc, 2022-03-04): delete this file

import type { Action, Error } from '../../types'
import type { Mount, Slot } from '../types'

// calibration request types
// TODO(mc, 2018-01-10): these should match up with the request actions;
//   explore how to link these concepts effectively
type CalibrationRequestType =
  | ''
  | 'MOVE_TO_FRONT'
  | 'PROBE_TIP'
  | 'MOVE_TO'
  | 'JOG'
  | 'PICKUP_AND_HOME'
  | 'DROP_TIP_AND_HOME'
  | 'CONFIRM_TIPRACK'
  | 'UPDATE_OFFSET'
  | 'SET_MODULES_REVIEWED'
  | 'RETURN_TIP'

export interface CalibrationRequest {
  readonly type: CalibrationRequestType
  readonly mount?: Mount
  readonly slot?: Slot
  readonly inProgress: boolean
  readonly error: Error | null
}

export interface CalibrationState {
  readonly deckPopulated: boolean | null | undefined
  readonly modulesReviewed: boolean | null | undefined

  readonly probedByMount: { [mount in Mount]?: boolean }
  readonly tipOnByMount: { [mount in Mount]?: boolean }

  readonly confirmedBySlot: { [slot in Slot]?: boolean }

  readonly calibrationRequest: CalibrationRequest
}

const INITIAL_STATE: CalibrationState = {
  deckPopulated: null,
  modulesReviewed: null,

  probedByMount: {},
  tipOnByMount: {},

  confirmedBySlot: {},

  calibrationRequest: { type: '', inProgress: false, error: null },
}

export function calibrationReducer(
  state: CalibrationState = INITIAL_STATE,
  action: Action
): CalibrationState {
  return state
}
