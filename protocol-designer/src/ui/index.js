// @flow
import { combineReducers } from 'redux'

import stepsReducer, { type StepsState } from './steps/reducers'
import type { Action } from '../types'

export type RootState = {|
  steps: StepsState,
|}

export const _uiSubReducers = {
  steps: stepsReducer,
}

export const rootReducer = combineReducers<_, Action>(_uiSubReducers)
