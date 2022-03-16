// robot reducer
import { combineReducers } from 'redux'

import { connectionReducer } from './connection'
import { sessionReducer } from './session'
import { calibrationReducer } from './calibration'

import type { Reducer } from 'redux'
import type { Action } from '../../types'
import type { ConnectionState } from './connection'
import type { SessionState } from './session'
import type { CalibrationState } from './calibration'

export interface RobotState {
  connection: ConnectionState
  session: SessionState
  calibration: CalibrationState
}

// TODO: (sa 2021-15-18: remove any typed state in combineReducers)
// TODO(mc, 2022-03-04): remove vestigal `session` and `calibration` states
export const robotReducer: Reducer<RobotState, Action> = combineReducers<
  any,
  Action
>({
  connection: connectionReducer,
  session: sessionReducer,
  calibration: calibrationReducer,
})
