// @flow
import { combineEpics } from 'redux-observable'
import { createRobotCalibrationCheckSessionEpic } from './createRobotCalibrationCheckSessionEpic'
import { fetchRobotCalibrationCheckSessionEpic } from './fetchRobotCalibrationCheckSessionEpic'
import { updateRobotCalibrationCheckSessionEpic } from './updateRobotCalibrationCheckSessionEpic'
import { deleteRobotCalibrationCheckSessionEpic } from './deleteRobotCalibrationCheckSessionEpic'

import type { Epic } from '../../types'

export const calibrationEpic: Epic = combineEpics(
  createRobotCalibrationCheckSessionEpic,
  fetchRobotCalibrationCheckSessionEpic,
  udpateRobotCalibrationCheckSessionEpic,
  deleteRobotCalibrationCheckSessionEpic
)
