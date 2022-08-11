// robot reducer
import { combineReducers } from 'redux'

import { connectionReducer } from './connection'

import type { Reducer } from 'redux'
import type { Action } from '../../types'
import type { ConnectionState } from './connection'

export interface RobotState {
  connection: ConnectionState
}

// TODO: (sa 2021-15-18: remove any typed state in combineReducers)
// TODO(mc, 2022-03-04): remove vestigal `session` and `calibration` states
export const robotReducer: Reducer<RobotState, Action> = combineReducers<
  any,
  Action
>({
  connection: connectionReducer,
})
