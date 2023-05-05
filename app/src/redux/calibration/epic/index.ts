import { combineEpics } from 'redux-observable'

import type { Epic } from '../../types'
import { pipetteOffsetCalibrationsEpic } from '../pipette-offset/epic'
import { tipLengthCalibrationsEpic } from '../tip-length/epic'
import { fetchCalibrationStatusEpic } from './fetchCalibrationStatusEpic'

export const calibrationEpic: Epic = combineEpics<Epic>(
  fetchCalibrationStatusEpic,
  pipetteOffsetCalibrationsEpic,
  tipLengthCalibrationsEpic
)
