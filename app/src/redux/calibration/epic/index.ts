import { combineEpics } from 'redux-observable'
import { fetchCalibrationStatusEpic } from './fetchCalibrationStatusEpic'
import { labwareCalibrationEpic } from '../labware/epic'
import { pipetteOffsetCalibrationsEpic } from '../pipette-offset/epic'
import { tipLengthCalibrationsEpic } from '../tip-length/epic'

import type { Epic } from '../../types'

export const calibrationEpic: Epic = combineEpics<Epic>(
  fetchCalibrationStatusEpic,
  labwareCalibrationEpic,
  pipetteOffsetCalibrationsEpic,
  tipLengthCalibrationsEpic
)
