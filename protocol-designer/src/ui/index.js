// @flow
import { combineReducers } from 'redux'

import stepsReducer, { type StepsState } from './steps/reducers'

export type RootState = {|
  steps: StepsState,
|}

export const _uiSubReducers = {
  steps: stepsReducer,
}

export const rootReducer = combineReducers(_uiSubReducers)
