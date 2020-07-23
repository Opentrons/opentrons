// @flow

import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../../robot-api/types'

import typeof {
  FETCH_ALL_LABWARE_CALIBRATIONS,
  FETCH_LABWARE_CALIBRATION_SUCCESS,
  FETCH_LABWARE_CALIBRATION_FAILURE,
} from './constants'

import type { AllLabwareCalibrations } from './../api-types'

export type FetchLabwareCalibrationAction = {|
  type: FETCH_ALL_LABWARE_CALIBRATIONS,
  payload: {|
    robotName: string,
    loadName: string | null,
    version: number | null,
    namespace: string | null,
  |},
  meta: RobotApiRequestMeta,
|}

export type FetchAllLabwareCalibrationSuccessAction = {|
  type: FETCH_LABWARE_CALIBRATION_SUCCESS,
  payload: {|
    robotName: string,
    labwareCalibration: AllLabwareCalibrations,
  |},
  meta: RobotApiRequestMeta,
|}

export type FetchLabwareCalibrationFailureAction = {|
  type: FETCH_LABWARE_CALIBRATION_FAILURE,
  payload: {| robotName: string, error: RobotApiErrorResponse |},
  meta: RobotApiRequestMeta,
|}

export type LawareCalibrationAction =
  | FetchLabwareCalibrationAction
  | FetchAllLabwareCalibrationSuccessAction
  | FetchLabwareCalibrationFailureAction
