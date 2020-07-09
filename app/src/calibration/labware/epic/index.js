// @flow

import { combineEpics } from 'redux-observable'
import { fetchAllLabwareCalibrationEpic } from './fetchAllLabwareCalibrationEpic'
import { fetchSingleLabwareCalibrationEpic } from './fetchSingleLabwareCalibrationEpic'

import type { Epic } from '../../../types'

export const labwareCalibrationEpic: Epic = combineEpics(
  fetchAllLabwareCalibrationEpic,
  fetchSingleLabwareCalibrationEpic
)
