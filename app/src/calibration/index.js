// @flow
// calibration data actions, selectors and constants
import { combineEpics } from 'redux-observable'
import { calibrationStatusEpic } from './epic'
import { labwareCalibrationEpic } from './labware/epic'

import type { Epic } from '../types'

export * from './actions'
export * from './constants'
export * from './selectors'
export * from './labware'

export const calibrationEpic: Epic = combineEpics(
  calibrationStatusEpic,
  labwareCalibrationEpic
)
