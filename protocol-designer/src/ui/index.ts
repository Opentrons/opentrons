import { combineReducers, Reducer } from 'redux'

import { Action } from '../types'
import { rootReducer as stepsReducer, StepsState } from './steps/reducers'

export interface RootState {
  steps: StepsState
}
export const _uiSubReducers = {
  steps: stepsReducer,
}
export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _uiSubReducers
)
