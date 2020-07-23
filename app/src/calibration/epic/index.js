// @flow

import { combineEpics } from 'redux-observable'
import { fetchCalibrationStatusEpic } from './fetchCalibrationStatusEpic'

import type { Epic } from '../../types'

export const calibrationStatusEpic: Epic = combineEpics(
  fetchCalibrationStatusEpic
)
