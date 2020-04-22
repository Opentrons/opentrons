// @flow
import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../robot-api/types'
import * as Types from './types'
import type { RobotCalibrationCheckSessionData } from './api-types'
import * as Constants from './constants'

// TODO: BC REMOVE THIS SHIM AND ALL CALLS TO IT WITH FEATURE FLAG REMOVAL
export const shimCurrentStep = (
  robotName: string,
  currentStep: string
): Types.TemporarySHimSetCurrentStepAction => ({
  type: Constants.TEMPORARY_SHIM_SET_CURRENT_STEP,
  payload: { robotName, currentStep },
  meta: {},
})

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

export const loadLabwareRobotCalibrationCheck = (
  robotName: string
): Types.RobotCalibrationCheckLoadLabwareAction => ({
  type: Constants.ROBOT_CALIBRATION_CHECK_LOAD_LABWARE,
  payload: { robotName },
  meta: {},
})

export const preparePipetteRobotCalibrationCheck = (
  robotName: string,
  pipetteId: string
): Types.RobotCalibrationCheckPreparePipetteAction => ({
  type: Constants.ROBOT_CALIBRATION_CHECK_PREPARE_PIPETTE,
  payload: { robotName, pipetteId },
  meta: {},
})

export const jogRobotCalibrationCheck = (
  robotName: string,
  pipetteId: string
): Types.RobotCalibrationCheckJogAction => ({
  type: Constants.ROBOT_CALIBRATION_CHECK_JOG,
  payload: { robotName, pipetteId },
  meta: {},
})

export const pickUpTipRobotCalibrationCheck = (
  robotName: string,
  pipetteId: string
): Types.RobotCalibrationCheckPickUpTipAction => ({
  type: Constants.ROBOT_CALIBRATION_CHECK_PICK_UP_TIP,
  payload: { robotName, pipetteId },
  meta: {},
})

export const updateRobotCalibrationCheckSessionSuccess = (
  robotName: string,
  body: RobotCalibrationCheckSessionData,
  meta: RobotApiRequestMeta
): Types.UpdateRobotCalibrationCheckSessionSuccessAction => ({
  type: Constants.UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const updateRobotCalibrationCheckSessionFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.UpdateRobotCalibrationCheckSessionFailureAction => ({
  type: Constants.UPDATE_ROBOT_CALIBRATION_CHECK_SESSION_FAILURE,
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
  meta: RobotApiRequestMeta
): Types.DeleteRobotCalibrationCheckSessionSuccessAction => ({
  type: Constants.DELETE_ROBOT_CALIBRATION_CHECK_SESSION_SUCCESS,
  payload: { robotName },
  meta: meta,
})

export const deleteRobotCalibrationCheckSessionFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
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
