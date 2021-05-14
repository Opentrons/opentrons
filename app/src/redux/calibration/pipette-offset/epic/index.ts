import { combineEpics } from 'redux-observable'
import { fetchPipetteOffsetCalibrationsEpic } from './fetchPipetteOffsetCalibrationsEpic'
import { fetchPipetteOffsetCalibrationsOnConnectEpic } from './fetchPipetteOffsetCalibrationsOnConnect'
import { fetchPipetteOffsetCalibrationsOnCalibrationEndEpic } from './fetchPipetteOffsetCalibrationsOnCalibrationEnd'

import type { Epic } from '../../../types'

export const pipetteOffsetCalibrationsEpic: Epic = combineEpics<Epic>(
  fetchPipetteOffsetCalibrationsEpic,
  fetchPipetteOffsetCalibrationsOnConnectEpic,
  fetchPipetteOffsetCalibrationsOnCalibrationEndEpic
)
