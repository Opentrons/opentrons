// @flow

import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../../robot-api/types'

import typeof {
  FETCH_ALL_LABWARE_CALIBRATIONS,
  FETCH_SINGLE_LABWARE_CALIBRATION,
  FETCH_LABWARE_CALIBRATION_SUCCESS,
  FETCH_LABWARE_CALIBRATION_FAILURE,
} from './constants'

import type {
  AllLabwareCalibrations,
  LabwareCalibrationObjects,
} from './../api-types'

export type FetchLabwareCalibrationAction = {|
  type: FETCH_ALL_LABWARE_CALIBRATIONS,
  payload: {|
    robotName: string,
    loadName?: string,
    version?: number,
    namespace?: string,
  |},
  meta: RobotApiRequestMeta,
|}

export type FetchSingleLabwareCalibrationAction = {|
  type: FETCH_SINGLE_LABWARE_CALIBRATION,
  payload: {|
    robotName: string,
    calibrationId: string,
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

export type FetchSingleLabwareCalibrationSuccessAction = {|
  type: FETCH_LABWARE_CALIBRATION_SUCCESS,
  payload: {|
    robotName: string,
    labwareCalibration: LabwareCalibrationObjects,
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
  | FetchSingleLabwareCalibrationAction
  | FetchAllLabwareCalibrationSuccessAction
  | FetchSingleLabwareCalibrationSuccessAction
  | FetchLabwareCalibrationFailureAction
