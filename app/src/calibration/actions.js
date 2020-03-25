// @flow
import type { RobotApiRequestMeta } from '../robot-api/types'
import type {
  FetchRobotCalibrationCheckSessionAction,
  FetchRobotCalibrationCheckSessionSuccessAction,
  FetchRobotCalibrationCheckSessionFailureAction,
  EndRobotCalibrationCheckSessionAction,
  EndRobotCalibrationCheckSessionSuccessAction,
  EndRobotCalibrationCheckSessionFailureAction,
  CompleteRobotCalibrationCheckAction,
} from './types'
import type { RobotCalibrationCheckSessionData } from './api-types'
import {
  FETCH_ROBOT_CALIBRATION_CHECK_SESSION,
  FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  FETCH_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  END_ROBOT_CALIBRATION_CHECK_SESSION,
  END_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  END_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  COMPLETE_ROBOT_CALIBRATION_CHECK,
} from './constants'

export const fetchRobotCalibrationCheckSession = (
  robotName: string
): FetchRobotCalibrationCheckSessionAction => ({
  type: FETCH_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: { robotName },
  meta: {},
})

export const fetchRobotCalibrationCheckSessionSuccess = (
  robotName: string,
  body: RobotCalibrationCheckSessionData,
  meta: RobotApiRequestMeta
): FetchRobotCalibrationCheckSessionSuccessAction => ({
  type: FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const fetchRobotCalibrationCheckSessionFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): FetchRobotCalibrationCheckSessionFailureAction => ({
  type: FETCH_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const endRobotCalibrationCheckSession = (
  robotName: string
): EndRobotCalibrationCheckSessionAction => ({
  type: END_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: { robotName },
  meta: {},
})

export const endRobotCalibrationCheckSessionSuccess = (
  robotName: string,
  body: RobotCalibrationCheckSessionData,
  meta: RobotApiRequestMeta
): EndRobotCalibrationCheckSessionSuccessAction => ({
  type: END_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: { robotName },
  meta: meta,
})

export const endRobotCalibrationCheckSessionFailure = (
  robotName: string,
  error: {},
  meta: RobotApiRequestMeta
): EndRobotCalibrationCheckSessionFailureAction => ({
  type: END_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const completeRobotCalibrationCheck = (
  robotName: string
): CompleteRobotCalibrationCheckAction => ({
  type: COMPLETE_ROBOT_CALIBRATION_CHECK,
  payload: { robotName },
})
