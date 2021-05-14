import * as Constants from './constants'
import * as Types from './types'

import type { AllTipLengthCalibrations } from '../api-types'

import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../../robot-api/types'

export const fetchTipLengthCalibrations = (
  robotName: string
): Types.FetchTipLengthCalibrationsAction => ({
  type: Constants.FETCH_TIP_LENGTH_CALIBRATIONS,
  payload: { robotName },
  meta: {},
})

export const fetchTipLengthCalibrationsSuccess = (
  robotName: string,
  tipLengthCalibrations: AllTipLengthCalibrations,
  meta: RobotApiRequestMeta
): Types.FetchTipLengthCalibrationsSuccessAction => ({
  type: Constants.FETCH_TIP_LENGTH_CALIBRATIONS_SUCCESS,
  payload: { robotName, tipLengthCalibrations },
  meta,
})

export const fetchTipLengthCalibrationsFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.FetchTipLengthCalibrationsFailureAction => ({
  type: Constants.FETCH_TIP_LENGTH_CALIBRATIONS_FAILURE,
  payload: { robotName, error },
  meta,
})
