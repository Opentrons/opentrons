import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../../robot-api/types'

import type { AllPipetteOffsetCalibrations } from '../api-types'

import {
  FETCH_PIPETTE_OFFSET_CALIBRATIONS,
  FETCH_PIPETTE_OFFSET_CALIBRATIONS_SUCCESS,
  FETCH_PIPETTE_OFFSET_CALIBRATIONS_FAILURE,
} from './constants'

export interface FetchPipetteOffsetCalibrationsAction {
  type: typeof FETCH_PIPETTE_OFFSET_CALIBRATIONS
  payload: { robotName: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchPipetteOffsetCalibrationsSuccessAction {
  type: typeof FETCH_PIPETTE_OFFSET_CALIBRATIONS_SUCCESS
  payload: {
    robotName: string
    pipetteOffsetCalibrations: AllPipetteOffsetCalibrations
  }
  meta: RobotApiRequestMeta
}

export interface FetchPipetteOffsetCalibrationsFailureAction {
  type: typeof FETCH_PIPETTE_OFFSET_CALIBRATIONS_FAILURE
  payload: { robotName: string; error: RobotApiErrorResponse }
  meta: RobotApiRequestMeta
}

export type PipetteOffsetCalibrationsAction =
  | FetchPipetteOffsetCalibrationsAction
  | FetchPipetteOffsetCalibrationsFailureAction
  | FetchPipetteOffsetCalibrationsSuccessAction
