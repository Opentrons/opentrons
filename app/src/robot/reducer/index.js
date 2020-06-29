// @flow
// robot reducer
import type { Reducer } from 'redux'
import { combineReducers } from 'redux'

import type { Action } from '../../types'
import type { CalibrationState } from './calibration'
import { calibrationReducer } from './calibration'
import type { ConnectionState } from './connection'
import { connectionReducer } from './connection'
import type { SessionState } from './session'
import { sessionReducer } from './session'

export type RobotState = {|
  connection: ConnectionState,
  session: SessionState,
  calibration: CalibrationState,
|}

export const robotReducer: Reducer<RobotState, Action> = combineReducers<
  _,
  Action
>({
  connection: connectionReducer,
  session: sessionReducer,
  calibration: calibrationReducer,
})
