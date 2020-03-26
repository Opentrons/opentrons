// @flow
// DEPRECATED - do not add to nor import from this module if you can help it
// TODO(mc, 2019-12-17): remove when able
// robot HTTP API client module
import { combineReducers } from 'redux'
import { calibrationReducer, type CalibrationAction } from './calibration'
import type { Action } from '../types'

export const superDeprecatedRobotApiReducer = combineReducers<_, Action>({
  calibration: calibrationReducer,
})

export * from './types'

export type {
  DeckCalStartState,
  DeckCalCommandState,
  JogAxis,
  JogDirection,
  JogStep,
  DeckCalPoint,
} from './calibration'

export type State = $Call<typeof superDeprecatedRobotApiReducer, void, Action>

export type HttpApiAction = CalibrationAction

export {
  startDeckCalibration,
  deckCalibrationCommand,
  clearDeckCalibration,
  makeGetDeckCalibrationStartState,
  makeGetDeckCalibrationCommandState,
} from './calibration'
