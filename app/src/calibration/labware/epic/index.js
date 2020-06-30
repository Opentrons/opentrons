// @flow

import { combineEpics } from 'redux-observable'
import {
  fetchAllLabwareCalibrationsEpic,
  fetchSingleLabwareCalibrationEpic,
} from './fetchLabwareCalibrationsEpic'

import type { Epic } from '../../../types'

export const labwareCalibrationEpic: Epic = combineEpics(
  fetchAllLabwareCalibrationsEpic,
  fetchSingleLabwareCalibrationEpic
)
