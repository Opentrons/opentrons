// @flow
import type { RobotApiRequestMeta } from '../robot-api/types'
import {
  FETCH_ROBOT_CALIBRATION_CHECK_SESSION,
  FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  FETCH_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  END_ROBOT_CALIBRATION_CHECK_SESSION,
  END_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  END_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  COMPLETE_ROBOT_CALIBRATION_CHECK,
} from './constants'
import type { RobotCalibrationCheckSessionData } from './api-types'

export type FetchRobotCalibrationCheckSessionAction = {|
  type: typeof FETCH_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchRobotCalibrationCheckSessionSuccessAction = {|
  type: typeof FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: {| robotName: string, ...RobotCalibrationCheckSessionData |},
  meta: RobotApiRequestMeta,
|}

export type FetchRobotCalibrationCheckSessionFailureAction = {|
  type: typeof FETCH_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type EndRobotCalibrationCheckSessionAction = {|
  type: typeof END_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type EndRobotCalibrationCheckSessionSuccessAction = {|
  type: typeof END_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type EndRobotCalibrationCheckSessionFailureAction = {|
  type: typeof END_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type CompleteRobotCalibrationCheckAction = {|
  type: typeof COMPLETE_ROBOT_CALIBRATION_CHECK,
  payload: {| robotName: string |},
|}

export type CalibrationAction =
  | FetchRobotCalibrationCheckSessionAction
  | FetchRobotCalibrationCheckSessionSuccessAction
  | FetchRobotCalibrationCheckSessionFailureAction
  | EndRobotCalibrationCheckSessionAction
  | EndRobotCalibrationCheckSessionSuccessAction
  | EndRobotCalibrationCheckSessionFailureAction
  | CompleteRobotCalibrationCheckAction

export type PerRobotCalibrationState = $ReadOnly<{|
  robotCalibrationCheck: RobotCalibrationCheckSessionData | null,
|}>

export type CalibrationState = $Shape<
  $ReadOnly<{|
    [robotName: string]: void | PerRobotCalibrationState,
  |}>
>
