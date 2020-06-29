// @flow
import { type Reducer, combineReducers } from 'redux'

import type { Action } from '../types'
import { type StepsState, rootReducer as stepsReducer } from './steps/reducers'

export type RootState = {|
  steps: StepsState,
|}

export const _uiSubReducers = {
  steps: stepsReducer,
}

export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _uiSubReducers
)
