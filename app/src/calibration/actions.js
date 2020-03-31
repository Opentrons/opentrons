// @flow
import type {
  RobotApiRequestMeta,
  RobotApiResponseMeta,
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
  meta: $Shape<{|
    ...RobotApiRequestMeta,
    ...RobotApiResponseMeta,
  |}>
): Types.CreateRobotCalibrationCheckSessionSuccessAction => ({
  type: Constants.CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const createRobotCalibrationCheckSessionFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: $Shape<{|
    ...RobotApiRequestMeta,
    ...RobotApiResponseMeta,
  |}>
): Types.CreateRobotCalibrationCheckSessionFailureAction => ({
  type: Constants.CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const deleteRobotCalibrationCheckSession = (
  robotName: string,
  recreate: boolean = false
): Types.DeleteRobotCalibrationCheckSessionAction => ({
  type: Constants.DELETE_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: { robotName, recreate },
  meta: {},
})

export const deleteRobotCalibrationCheckSessionSuccess = (
  robotName: string,
  body: { message: string },
  meta: $Shape<{|
    ...RobotApiRequestMeta,
    ...RobotApiResponseMeta,
  |}>
): Types.DeleteRobotCalibrationCheckSessionSuccessAction => ({
  type: Constants.DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: { robotName },
  meta: meta,
})

export const deleteRobotCalibrationCheckSessionFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: $Shape<{|
    ...RobotApiRequestMeta,
    ...RobotApiResponseMeta,
  |}>
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
