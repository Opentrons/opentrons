// @flow
// DEPRECATED - do not add to nor import from this module if you can help it
// TODO(mc, 2019-12-17): remove when able
// robot HTTP API client module
import { combineReducers } from 'redux'
import apiReducer from './reducer'
import { calibrationReducer, type CalibrationAction } from './calibration'
import type { NetworkingAction } from './networking'
import type { Action } from '../types'

export const superDeprecatedRobotApiReducer = combineReducers<_, Action>({
  calibration: calibrationReducer,
  api: apiReducer,
})

export * from './types'

export type {
  ApiRequestAction,
  ApiSuccessAction,
  ApiFailureAction,
  ClearApiResponseAction,
} from './actions'

export type {
  DeckCalStartState,
  DeckCalCommandState,
  JogAxis,
  JogDirection,
  JogStep,
  DeckCalPoint,
} from './calibration'

export type State = $Call<typeof superDeprecatedRobotApiReducer, void, Action>

export type HttpApiAction = CalibrationAction | NetworkingAction

export {
  startDeckCalibration,
  deckCalibrationCommand,
  clearDeckCalibration,
  makeGetDeckCalibrationStartState,
  makeGetDeckCalibrationCommandState,
} from './calibration'

export * from './networking'
