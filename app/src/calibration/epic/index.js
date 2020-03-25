// @flow
import { combineEpics } from 'redux-observable'
import { fetchRobotCalibrationCheckSessionEpic } from './fetchRobotCalibrationCheckSessionEpic'
import { endRobotCalibrationCheckSessionEpic } from './endRobotCalibrationCheckSessionEpic'

import type { Epic } from '../../types'

export const calibrationEpic: Epic = combineEpics(
  fetchRobotCalibrationCheckSessionEpic,
  endRobotCalibrationCheckSessionEpic
)
