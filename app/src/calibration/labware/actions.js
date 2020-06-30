// @flow

import * as Constants from './constants'
import * as Types from './types'

import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../../robot-api/types'

export const fetchAllLabwareCalibrations = (
  robotName: string
): Types.FetchCalibrationStatusAction => ({
  type: Constants.FETCH_ALL_LABWARE_CALIBRATIONS,
  payload: { robotName },
  meta: {},
})

export const fetchSingleLabwareCalibration = (
  robotName: string
): Types.FetchCalibrationStatusAction => ({
  type: Constants.FETCH_SINGLE_LABWARE_CALIBRATION,
  payload: { robotName },
  meta: {},
})

export const fetchLabwareCalibrationSuccess = (
  robotName: string,
  calibrationStatus: Types.CalibrationStatus,
  meta: RobotApiRequestMeta
): Types.FetchCalibrationStatusSuccessAction => ({
  type: Constants.FETCH_LABWARE_CALIBRATION_SUCCESS,
  payload: { robotName, calibrationStatus },
  meta,
})

export const fetchLabwareCalibrationFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.FetchCalibrationStatusFailureAction => ({
  type: Constants.FETCH_LABWARE_CALIBRATION_FAILURE,
  payload: { robotName, error },
  meta,
})
