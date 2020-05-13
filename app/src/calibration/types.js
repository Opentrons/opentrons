// @flow
import type { RobotApiRequestMeta } from '../robot-api/types'
import typeof {
  CREATE_ROBOT_CALIBRATION_CHECK_SESSION,
  CREATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  CREATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  FETCH_ROBOT_CALIBRATION_CHECK_SESSION,
  FETCH_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  FETCH_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  ROBOT_CALIBRATION_CHECK_LOAD_LABWARE,
  ROBOT_CALIBRATION_CHECK_PREPARE_PIPETTE,
  ROBOT_CALIBRATION_CHECK_JOG,
  ROBOT_CALIBRATION_CHECK_PICK_UP_TIP,
  ROBOT_CALIBRATION_CHECK_CONFIRM_TIP,
  ROBOT_CALIBRATION_CHECK_INVALIDATE_TIP,
  ROBOT_CALIBRATION_CHECK_COMPARE_POINT,
  ROBOT_CALIBRATION_CHECK_CONFIRM_STEP,
  UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  DELETE_ROBOT_CALIBRATION_CHECK_SESSION,
  DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  DELETE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
  COMPLETE_ROBOT_CALIBRATION_CHECK,
} from './constants'
import type { RobotCalibrationCheckSessionData } from './api-types'

export type JogVector = Array<number>
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
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type RobotCalibrationCheckJogAction = {|
  type: ROBOT_CALIBRATION_CHECK_JOG,
  payload: {| robotName: string, vector: JogVector |},
  meta: RobotApiRequestMeta,
|}

export type RobotCalibrationCheckPickUpTipAction = {|
  type: ROBOT_CALIBRATION_CHECK_PICK_UP_TIP,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type RobotCalibrationCheckConfirmTipAction = {|
  type: ROBOT_CALIBRATION_CHECK_CONFIRM_TIP,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type RobotCalibrationCheckInvalidateTipAction = {|
  type: ROBOT_CALIBRATION_CHECK_INVALIDATE_TIP,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type RobotCalibrationCheckComparePointAction = {|
  type: ROBOT_CALIBRATION_CHECK_COMPARE_POINT,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type RobotCalibrationCheckConfirmStepAction = {|
  type: ROBOT_CALIBRATION_CHECK_CONFIRM_STEP,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type UpdateRobotCalibrationCheckSessionAction =
  | RobotCalibrationCheckLoadLabwareAction
  | RobotCalibrationCheckPreparePipetteAction
  | RobotCalibrationCheckJogAction
  | RobotCalibrationCheckPickUpTipAction
  | RobotCalibrationCheckConfirmTipAction
  | RobotCalibrationCheckInvalidateTipAction
  | RobotCalibrationCheckComparePointAction
  | RobotCalibrationCheckConfirmStepAction

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
  | CreateRobotCalibrationCheckSessionAction
  | CreateRobotCalibrationCheckSessionSuccessAction
  | CreateRobotCalibrationCheckSessionFailureAction
  | FetchRobotCalibrationCheckSessionAction
  | FetchRobotCalibrationCheckSessionSuccessAction
  | FetchRobotCalibrationCheckSessionFailureAction
  | UpdateRobotCalibrationCheckSessionAction
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
