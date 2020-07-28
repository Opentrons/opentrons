// @flow

import { combineEpics } from 'redux-observable'
import { fetchCalibrationStatusEpic } from './fetchCalibrationStatusEpic'
import { labwareCalibrationEpic } from '../labware/epic'

import type { Epic } from '../../types'

export const calibrationEpic: Epic = combineEpics(
  fetchCalibrationStatusEpic,
  labwareCalibrationEpic
)
