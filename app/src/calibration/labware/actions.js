// @flow

import * as Constants from './constants'
import * as Types from './types'
import * as APITypes from '../types'

import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../../robot-api/types'

export const fetchLabwareCalibrations = (
  robotName: string
): Types.FetchLabwareCalibrationsAction => ({
  type: Constants.FETCH_LABWARE_CALIBRATIONS,
  payload: { robotName },
  meta: {},
})

export const fetchLabwareCalibrationsSuccess = (
  robotName: string,
  labwareCalibrations: APITypes.AllLabwareCalibrations,
  meta: RobotApiRequestMeta
): Types.FetchLabwareCalibrationsSuccessAction => ({
  type: Constants.FETCH_LABWARE_CALIBRATIONS_SUCCESS,
  payload: { robotName, labwareCalibrations },
  meta,
})

export const fetchLabwareCalibrationsFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.FetchLabwareCalibrationsFailureAction => ({
  type: Constants.FETCH_LABWARE_CALIBRATIONS_FAILURE,
  payload: { robotName, error },
  meta,
})
