// @flow
import { combineReducers, type Reducer } from 'redux'

import { rootReducer as stepsReducer, type StepsState } from './steps/reducers'
import type { Action } from '../types'

export type RootState = {|
  steps: StepsState,
|}

export const _uiSubReducers = {
  steps: stepsReducer,
}

export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _uiSubReducers
)
