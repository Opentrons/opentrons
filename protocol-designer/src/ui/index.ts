import { combineReducers, Reducer } from 'redux'
import { rootReducer as stepsReducer, StepsState } from './steps/reducers'
import { Action } from '../types'
export interface RootState {
  steps: StepsState
}
export const _uiSubReducers = {
  steps: stepsReducer,
}
export const rootReducer: Reducer<RootState, Action> = combineReducers(
  _uiSubReducers
)
