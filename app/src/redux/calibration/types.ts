import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../robot-api/types'

import type {
  CalibrationStatus,
  AllPipetteOffsetCalibrations,
  AllTipLengthCalibrations,
} from './api-types'

import type { PipetteOffsetCalibrationsAction } from './pipette-offset/types'
import type { TipLengthCalibrationsAction } from './tip-length/types'

import {
  FETCH_CALIBRATION_STATUS,
  FETCH_CALIBRATION_STATUS_SUCCESS,
  FETCH_CALIBRATION_STATUS_FAILURE,
} from './constants'

export * from './api-types'
export * from './pipette-offset/types'
export * from './tip-length/types'

export interface FetchCalibrationStatusAction {
  type: typeof FETCH_CALIBRATION_STATUS
  payload: { robotName: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchCalibrationStatusSuccessAction {
  type: typeof FETCH_CALIBRATION_STATUS_SUCCESS
  payload: {
    robotName: string
    calibrationStatus: CalibrationStatus
  }
  meta: RobotApiRequestMeta
}

export interface FetchCalibrationStatusFailureAction {
  type: typeof FETCH_CALIBRATION_STATUS_FAILURE
  payload: { robotName: string; error: RobotApiErrorResponse }
  meta: RobotApiRequestMeta
}

export type CalibrationAction =
  | FetchCalibrationStatusAction
  | FetchCalibrationStatusSuccessAction
  | FetchCalibrationStatusFailureAction
  | PipetteOffsetCalibrationsAction
  | TipLengthCalibrationsAction

export type PerRobotCalibrationState = Readonly<{
  calibrationStatus: CalibrationStatus | null
  pipetteOffsetCalibrations: AllPipetteOffsetCalibrations | null
  tipLengthCalibrations: AllTipLengthCalibrations | null
}>

export type CalibrationState = Readonly<
  Partial<{
    [robotName: string]: PerRobotCalibrationState
  }>
>

export interface ProtocolCalibrationStatus {
  complete: boolean
  reason?:
    | 'calibrate_deck_failure_reason'
    | 'calibrate_tiprack_failure_reason'
    | 'calibrate_pipette_failure_reason'
    | 'calibrate_gripper_failure_reason'
    | 'attach_gripper_failure_reason'
    | 'attach_pipette_failure_reason'
}
