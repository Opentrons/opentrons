import * as Constants from './constants'
import * as Types from './types'

import type { AllPipetteOffsetCalibrations } from '../api-types'

import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../../robot-api/types'

export const fetchPipetteOffsetCalibrations = (
  robotName: string
): Types.FetchPipetteOffsetCalibrationsAction => ({
  type: Constants.FETCH_PIPETTE_OFFSET_CALIBRATIONS,
  payload: { robotName },
  meta: {},
})

export const fetchPipetteOffsetCalibrationsSuccess = (
  robotName: string,
  pipetteOffsetCalibrations: AllPipetteOffsetCalibrations,
  meta: RobotApiRequestMeta
): Types.FetchPipetteOffsetCalibrationsSuccessAction => ({
  type: Constants.FETCH_PIPETTE_OFFSET_CALIBRATIONS_SUCCESS,
  payload: { robotName, pipetteOffsetCalibrations },
  meta,
})

export const fetchPipetteOffsetCalibrationsFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.FetchPipetteOffsetCalibrationsFailureAction => ({
  type: Constants.FETCH_PIPETTE_OFFSET_CALIBRATIONS_FAILURE,
  payload: { robotName, error },
  meta,
})
