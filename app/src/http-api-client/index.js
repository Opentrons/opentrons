// @flow
// DEPRECATED - do not add to nor import from this module if you can help it
// TODO(mc, 2019-12-17): remove when able
// robot HTTP API client module
import type { Reducer } from 'redux'
import { combineReducers } from 'redux'

import type { Action } from '../types'
import type { CalibrationAction, CalState } from './calibration'
import { calibrationReducer } from './calibration'

export type State = {|
  calibration: CalState,
|}

export const superDeprecatedRobotApiReducer: Reducer<
  State,
  Action
> = combineReducers<_, Action>({
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

export type HttpApiAction = CalibrationAction

export {
  startDeckCalibration,
  deckCalibrationCommand,
  clearDeckCalibration,
  makeGetDeckCalibrationStartState,
  makeGetDeckCalibrationCommandState,
} from './calibration'
