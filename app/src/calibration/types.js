// @flow
import type {
  RobotApiRequestMeta,
  RobotApiResponseMeta,
} from '../robot-api/types'
import typeof {
  CREATE_ROBOT_CALIBRATION_CHECK_SESSION,
  CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  DELETE_ROBOT_CALIBRATION_CHECK_SESSION,
  DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  DELETE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  COMPLETE_ROBOT_CALIBRATION_CHECK,
} from './constants'
import type { RobotCalibrationCheckSessionData } from './api-types'

export type CreateRobotCalibrationCheckSessionAction = {|
  type: CREATE_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type CreateRobotCalibrationCheckSessionSuccessAction = {|
  type: CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: {| robotName: string, ...RobotCalibrationCheckSessionData |},
  meta: $Shape<{|
    ...RobotApiResponseMeta,
    ...RobotApiRequestMeta,
    recreating?: boolean,
  |}>,
|}

export type CreateRobotCalibrationCheckSessionFailureAction = {|
  type: CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: $Shape<{| robotName: string, error: {} |}>,
  meta: $Shape<{|
    ...RobotApiResponseMeta,
    ...RobotApiRequestMeta,
    recreating?: boolean,
  |}>,
|}

export type DeleteRobotCalibrationCheckSessionAction = {|
  type: DELETE_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: $Shape<{| robotName: string |}>,
  meta: $Shape<{|
    ...RobotApiResponseMeta,
    ...RobotApiRequestMeta,
    recreating?: boolean,
  |}>,
|}

export type DeleteRobotCalibrationCheckSessionSuccessAction = {|
  type: DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: {| robotName: string |},
  meta: $Shape<{|
    ...RobotApiResponseMeta,
    ...RobotApiRequestMeta,
    recreating?: boolean,
  |}>,
|}

export type DeleteRobotCalibrationCheckSessionFailureAction = {|
  type: DELETE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: {| robotName: string, error: {} |},
  meta: $Shape<{|
    ...RobotApiResponseMeta,
    ...RobotApiRequestMeta,
    recreating?: boolean,
  |}>,
|}

export type CompleteRobotCalibrationCheckAction = {|
  type: COMPLETE_ROBOT_CALIBRATION_CHECK,
  payload: {| robotName: string |},
|}

export type CalibrationAction =
  | CreateRobotCalibrationCheckSessionAction
  | CreateRobotCalibrationCheckSessionSuccessAction
  | CreateRobotCalibrationCheckSessionFailureAction
  | DeleteRobotCalibrationCheckSessionAction
  | DeleteRobotCalibrationCheckSessionSuccessAction
  | DeleteRobotCalibrationCheckSessionFailureAction
  | CompleteRobotCalibrationCheckAction

export type PerRobotCalibrationState = $ReadOnly<{|
  robotCalibrationCheck: RobotCalibrationCheckSessionData | null,
|}>

export type CalibrationState = $Shape<
  $ReadOnly<{|
    [robotName: string]: void | PerRobotCalibrationState,
  |}>
>
