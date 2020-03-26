// @flow
import { combineEpics } from 'redux-observable'
import { createRobotCalibrationCheckSessionEpic } from './createRobotCalibrationCheckSessionEpic'
import { deleteRobotCalibrationCheckSessionEpic } from './deleteRobotCalibrationCheckSessionEpic'

import type { Epic } from '../../types'

export const calibrationEpic: Epic = combineEpics(
  createRobotCalibrationCheckSessionEpic,
  deleteRobotCalibrationCheckSessionEpic
)
