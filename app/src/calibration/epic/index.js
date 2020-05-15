// @flow
import { combineEpics } from 'redux-observable'
import { fetchRobotCalibrationCheckSessionEpic } from './fetchRobotCalibrationCheckSessionEpic'

import type { Epic } from '../../types'

export const calibrationEpic: Epic = combineEpics(
  fetchRobotCalibrationCheckSessionEpic
)
