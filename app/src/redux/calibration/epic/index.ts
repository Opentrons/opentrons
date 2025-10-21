import { combineEpics } from 'redux-observable'

import { pipetteOffsetCalibrationsEpic } from '../pipette-offset/epic'
import { tipLengthCalibrationsEpic } from '../tip-length/epic'
import { fetchCalibrationStatusEpic } from './fetchCalibrationStatusEpic'

import type { Epic } from '../../types'

export const calibrationEpic: Epic = combineEpics<Epic>(
  fetchCalibrationStatusEpic,
  pipetteOffsetCalibrationsEpic,
  tipLengthCalibrationsEpic
)
