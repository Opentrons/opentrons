import { combineReducers } from 'redux'
import type { Reducer } from 'redux'
import type { Action } from '../types'
import { rootReducer as stepsReducer } from './steps/reducers'
import type { StepsState } from './steps/reducers'

export interface RootState {
  steps: StepsState
}
export const _uiSubReducers = {
  steps: stepsReducer,
}
export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _uiSubReducers
)
