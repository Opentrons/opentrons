// @flow
import { combineEpics } from 'redux-observable'
import { fetchRobotCalibrationCheckSessionEpic } from './fetchRobotCalibrationCheckSessionEpic'
import { deleteRobotCalibrationCheckSessionEpic } from './deleteRobotCalibrationCheckSessionEpic'

import type { Epic } from '../../types'

export const calibrationEpic: Epic = combineEpics(
  fetchRobotCalibrationCheckSessionEpic,
  deleteRobotCalibrationCheckSessionEpic
)
