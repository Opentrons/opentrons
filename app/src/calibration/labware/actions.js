// @flow

import * as Constants from './constants'
import * as Types from './types'
import * as APITypes from '../types'

import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../../robot-api/types'

export const fetchAllLabwareCalibrations = (
  robotName: string,
  loadName?: string,
  namespace?: string,
  version?: number
): Types.FetchLabwareCalibrationAction => ({
  type: Constants.FETCH_ALL_LABWARE_CALIBRATIONS,
  payload: { robotName, loadName, namespace, version },
  meta: {},
})

export const fetchLabwareCalibrationsSuccess = (
  robotName: string,
  labwareCalibration: APITypes.AllLabwareCalibrations,
  meta: RobotApiRequestMeta
): Types.FetchAllLabwareCalibrationSuccessAction => ({
  type: Constants.FETCH_LABWARE_CALIBRATION_SUCCESS,
  payload: { robotName, labwareCalibration },
  meta,
})

export const fetchLabwareCalibrationsFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.FetchLabwareCalibrationFailureAction => ({
  type: Constants.FETCH_LABWARE_CALIBRATION_FAILURE,
  payload: { robotName, error },
  meta,
})
