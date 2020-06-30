// @flow
// robot reducer
import { combineReducers } from 'redux'

import type { Reducer } from 'redux'
import type { Action } from '../../types'
import { connectionReducer } from './connection'
import { sessionReducer } from './session'
import { calibrationReducer } from './calibration'

import type { ConnectionState } from './connection'
import type { SessionState } from './session'
import type { CalibrationState } from './calibration'

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
