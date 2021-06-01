import { combineEpics } from 'redux-observable'
import { fetchTipLengthCalibrationsEpic } from './fetchTipLengthCalibrationsEpic'

import type { Epic } from '../../../types'
import { fetchTipLengthCalibrationsOnCalibrationEndEpic } from './fetchTipLengthCalibrationsOnCalibrationEnd'

export const tipLengthCalibrationsEpic: Epic = combineEpics<Epic>(
  fetchTipLengthCalibrationsEpic,
  fetchTipLengthCalibrationsOnCalibrationEndEpic
)
