// @flow

import { combineEpics } from 'redux-observable'
import { fetchLabwareCalibrationsEpic } from './fetchLabwareCalibrationsEpic'

import type { Epic } from '../../../types'

export const labwareCalibrationEpic: Epic = combineEpics(
  fetchLabwareCalibrationsEpic
)
