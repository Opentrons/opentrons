import type { Reducer } from 'redux'
import { combineReducers } from 'redux'
import type { StepsState } from './steps/reducers'
import { rootReducer as stepsReducer } from './steps/reducers'
import type { Action } from '../types'
export type RootState = {
  steps: StepsState
}
export const _uiSubReducers = {
  steps: stepsReducer,
}
export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _uiSubReducers
)
