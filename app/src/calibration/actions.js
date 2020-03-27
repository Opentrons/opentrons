// @flow
import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../robot-api/types'
import * as Types from './types'
import type { RobotCalibrationCheckSessionData } from './api-types'
import * as Constants from './constants'

export const createRobotCalibrationCheckSession = (
  robotName: string
): Types.CreateRobotCalibrationCheckSessionAction => ({
  type: Constants.CREATE_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: { robotName },
  meta: {},
})

export const createRobotCalibrationCheckSessionSuccess = (
  robotName: string,
  body: RobotCalibrationCheckSessionData,
  meta: RobotApiRequestMeta
): Types.CreateRobotCalibrationCheckSessionSuccessAction => ({
  type: Constants.CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const createRobotCalibrationCheckSessionFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.CreateRobotCalibrationCheckSessionFailureAction => ({
  type: Constants.CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const deleteRobotCalibrationCheckSession = (
  robotName: string
): Types.DeleteRobotCalibrationCheckSessionAction => ({
  type: Constants.DELETE_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: { robotName },
  meta: {},
})

export const deleteRobotCalibrationCheckSessionSuccess = (
  robotName: string,
  body: { message: string },
  meta: $Shape<{| ...RobotApiRequestMeta, recreating?: boolean |}>
): Types.DeleteRobotCalibrationCheckSessionSuccessAction => ({
  type: Constants.DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: { robotName },
  meta: meta,
})

export const deleteRobotCalibrationCheckSessionFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: $Shape<{| ...RobotApiRequestMeta, recreating?: boolean |}>
): Types.DeleteRobotCalibrationCheckSessionFailureAction => ({
  type: Constants.DELETE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const completeRobotCalibrationCheck = (
  robotName: string
): Types.CompleteRobotCalibrationCheckAction => ({
  type: Constants.COMPLETE_ROBOT_CALIBRATION_CHECK,
  payload: { robotName },
})
