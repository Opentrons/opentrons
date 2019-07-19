// @flow
// robot reducer
// TODO(mc, 2017-10-05): Split into sub-reducers or different redux modules
import { combineReducers } from 'redux'

import connectionReducer, { type ConnectionState } from './connection'
import sessionReducer, { type SessionState } from './session'
import calibrationReducer, { type CalibrationState } from './calibration'

import type { Reducer } from 'redux'
import type { Action } from '../../types'

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
