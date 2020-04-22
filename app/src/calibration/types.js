// @flow
import type { RobotApiRequestMeta } from '../robot-api/types'
import typeof {
  TEMPORARY_SHIM_SET_CURRENT_STEP,
  CREATE_ROBOT_CALIBRATION_CHECK_SESSION,
  CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  FETCH_ROBOT_CALIBRATION_CHECK_SESSION,
  FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  FETCH_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  ROBOT_CALIBRATION_CHECK_LOAD_LABWARE,
  ROBOT_CALIBRATION_CHECK_PREPARE_PIPETTE,
  ROBOT_CALIBRATION_CHECK_PICK_UP_TIP,
  UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  DELETE_ROBOT_CALIBRATION_CHECK_SESSION,
  DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  DELETE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  COMPLETE_ROBOT_CALIBRATION_CHECK,
} from './constants'
import type { RobotCalibrationCheckSessionData } from './api-types'
import {} from './constants'

export type TemporaryShimSetCurrentStepAction = {|
  type: TEMPORARY_SHIM_SET_CURRENT_STEP,
  payload: {| robotName: string, currentStep: string |},
  meta: RobotApiRequestMeta,
|}
export type CreateRobotCalibrationCheckSessionAction = {|
  type: CREATE_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type CreateRobotCalibrationCheckSessionSuccessAction = {|
  type: CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: {| robotName: string, ...RobotCalibrationCheckSessionData |},
  meta: RobotApiRequestMeta,
|}

export type CreateRobotCalibrationCheckSessionFailureAction = {|
  type: CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type FetchRobotCalibrationCheckSessionAction = {|
  type: FETCH_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchRobotCalibrationCheckSessionSuccessAction = {|
  type: FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: {| robotName: string, ...RobotCalibrationCheckSessionData |},
  meta: RobotApiRequestMeta,
|}

export type FetchRobotCalibrationCheckSessionFailureAction = {|
  type: FETCH_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type RobotCalibrationCheckLoadLabwareAction = {|
  type: ROBOT_CALIBRATION_CHECK_LOAD_LABWARE,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type RobotCalibrationCheckPreparePipetteAction = {|
  type: ROBOT_CALIBRATION_CHECK_PREPARE_PIPETTE,
  payload: {| robotName: string, pipetteId: string |},
  meta: RobotApiRequestMeta,
|}

export type RobotCalibrationCheckPickUpTipAction = {|
  type: ROBOT_CALIBRATION_CHECK_PICK_UP_TIP,
  payload: {| robotName: string, pipetteId: string |},
  meta: RobotApiRequestMeta,
|}

export type UpdateRobotCalibrationCheckSessionAction =
  | RobotCalibrationCheckLoadLabwareAction
  | RobotCalibrationCheckPreparePipetteAction
  | RobotCalibrationCheckPickUpTipAction

export type UpdateRobotCalibrationCheckSessionSuccessAction = {|
  type: UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: {| robotName: string, ...RobotCalibrationCheckSessionData |},
  meta: RobotApiRequestMeta,
|}

export type UpdateRobotCalibrationCheckSessionFailureAction = {|
  type: UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type DeleteRobotCalibrationCheckSessionAction = {|
  type: DELETE_ROBOT_CALIBRATION_CHECK_SESSION,
  payload: {| robotName: string, recreate: boolean |},
  meta: RobotApiRequestMeta,
|}

export type DeleteRobotCalibrationCheckSessionSuccessAction = {|
  type: DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type DeleteRobotCalibrationCheckSessionFailureAction = {|
  type: DELETE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type CompleteRobotCalibrationCheckAction = {|
  type: COMPLETE_ROBOT_CALIBRATION_CHECK,
  payload: {| robotName: string |},
|}

export type CalibrationAction =
  | TemporaryShimSetCurrentStepAction
  | CreateRobotCalibrationCheckSessionAction
  | CreateRobotCalibrationCheckSessionSuccessAction
  | CreateRobotCalibrationCheckSessionFailureAction
  | FetchRobotCalibrationCheckSessionAction
  | FetchRobotCalibrationCheckSessionSuccessAction
  | FetchRobotCalibrationCheckSessionFailureAction
  | RobotCalibrationCheckLoadLabwareAction
  | RobotCalibrationCheckPickUpTipAction
  | UpdateRobotCalibrationCheckSessionSuccessAction
  | UpdateRobotCalibrationCheckSessionFailureAction
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
