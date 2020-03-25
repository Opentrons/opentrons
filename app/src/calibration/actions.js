// @flow
import type { RobotApiRequestMeta, RobotApiErrorResponse } from '../robot-api/types'
import * as Types from './types'
import type { RobotCalibrationCheckSessionData } from './api-types'
import * as Constants from './constants'

export const fetchRobotCalibrationCheckSession = (
  robotName: string
): Types.FetchRobotCalibrationCheckSessionAction => ({
  type: Constants.FETCH_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: { robotName },
  meta: {},
})

export const fetchRobotCalibrationCheckSessionSuccess = (
  robotName: string,
  body: RobotCalibrationCheckSessionData,
  meta: RobotApiRequestMeta
): Types.FetchRobotCalibrationCheckSessionSuccessAction => ({
  type: Constants.FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const fetchRobotCalibrationCheckSessionFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.FetchRobotCalibrationCheckSessionFailureAction => ({
  type: Constants.FETCH_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const endRobotCalibrationCheckSession = (
  robotName: string
): Types.EndRobotCalibrationCheckSessionAction => ({
  type: Constants.END_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: { robotName },
  meta: {},
})

export const endRobotCalibrationCheckSessionSuccess = (
  robotName: string,
  body: RobotCalibrationCheckSessionData,
  meta: RobotApiRequestMeta
): Types.EndRobotCalibrationCheckSessionSuccessAction => ({
  type: Constants.END_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: { robotName },
  meta: meta,
})

export const endRobotCalibrationCheckSessionFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.EndRobotCalibrationCheckSessionFailureAction => ({
  type: Constants.END_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const completeRobotCalibrationCheck = (
  robotName: string
): Types.CompleteRobotCalibrationCheckAction => ({
  type: Constants.COMPLETE_ROBOT_CALIBRATION_CHECK,
  payload: { robotName },
})
