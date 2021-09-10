import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../robot-api/types'

import type {
  CalibrationStatus,
  AllLabwareCalibrations,
  AllPipetteOffsetCalibrations,
  AllTipLengthCalibrations,
} from './api-types'

import type { LabwareCalibrationAction } from './labware/types'
import type { PipetteOffsetCalibrationsAction } from './pipette-offset/types'
import type { TipLengthCalibrationsAction } from './tip-length/types'

import {
  FETCH_CALIBRATION_STATUS,
  FETCH_CALIBRATION_STATUS_SUCCESS,
  FETCH_CALIBRATION_STATUS_FAILURE,
} from './constants'

export * from './api-types'
export * from './labware/types'
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
  | LabwareCalibrationAction
  | PipetteOffsetCalibrationsAction
  | TipLengthCalibrationsAction

export type PerRobotCalibrationState = Readonly<{
  calibrationStatus: CalibrationStatus | null
  labwareCalibrations: AllLabwareCalibrations | null
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
  reason?: {}
}
