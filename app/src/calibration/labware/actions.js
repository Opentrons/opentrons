// @flow

import * as Constants from './constants'
import * as Types from './types'
import * as APITypes from '../types'

import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../../robot-api/types'

export const fetchAllLabwareCalibrations = (
  robotName: string
): Types.FetchLabwareCalibrationAction => ({
  type: Constants.FETCH_ALL_LABWARE_CALIBRATIONS,
  payload: { robotName },
  meta: {},
})

export const fetchSingleLabwareCalibration = (
  robotName: string,
  calibrationId: string
): Types.FetchSingleLabwareCalibrationAction => ({
  type: Constants.FETCH_SINGLE_LABWARE_CALIBRATION,
  payload: { robotName, calibrationId },
  meta: {},
})

export const fetchSingleLabwareCalibrationSuccess = (
  robotName: string,
  labwareCalibration: APITypes.LabwareCalibrationObjects,
  meta: RobotApiRequestMeta
): Types.FetchSingleLabwareCalibrationSuccessAction => ({
  type: Constants.FETCH_LABWARE_CALIBRATION_SUCCESS,
  payload: { robotName, labwareCalibration },
  meta,
})

export const fetchLabwareCalibrationSuccess = (
  robotName: string,
  labwareCalibration: APITypes.AllLabwareCalibrations,
  meta: RobotApiRequestMeta
): Types.FetchAllLabwareCalibrationSuccessAction => ({
  type: Constants.FETCH_LABWARE_CALIBRATION_SUCCESS,
  payload: { robotName, labwareCalibration },
  meta,
})

export const fetchLabwareCalibrationFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.FetchLabwareCalibrationFailureAction => ({
  type: Constants.FETCH_LABWARE_CALIBRATION_FAILURE,
  payload: { robotName, error },
  meta,
})
