import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../../robot-api/types'

import type { AllTipLengthCalibrations } from '../api-types'

import {
  FETCH_TIP_LENGTH_CALIBRATIONS,
  FETCH_TIP_LENGTH_CALIBRATIONS_SUCCESS,
  FETCH_TIP_LENGTH_CALIBRATIONS_FAILURE,
} from './constants'

export interface FetchTipLengthCalibrationsAction {
  type: typeof FETCH_TIP_LENGTH_CALIBRATIONS
  payload: { robotName: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchTipLengthCalibrationsSuccessAction {
  type: typeof FETCH_TIP_LENGTH_CALIBRATIONS_SUCCESS
  payload: {
    robotName: string
    tipLengthCalibrations: AllTipLengthCalibrations
  }
  meta: RobotApiRequestMeta
}

export interface FetchTipLengthCalibrationsFailureAction {
  type: typeof FETCH_TIP_LENGTH_CALIBRATIONS_FAILURE
  payload: { robotName: string; error: RobotApiErrorResponse }
  meta: RobotApiRequestMeta
}

export type TipLengthCalibrationsAction =
  | FetchTipLengthCalibrationsAction
  | FetchTipLengthCalibrationsFailureAction
  | FetchTipLengthCalibrationsSuccessAction
