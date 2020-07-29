// @flow

import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../../robot-api/types'

import typeof {
  FETCH_LABWARE_CALIBRATIONS,
  FETCH_LABWARE_CALIBRATIONS_SUCCESS,
  FETCH_LABWARE_CALIBRATIONS_FAILURE,
} from './constants'

import type { AllLabwareCalibrations } from './../api-types'

export type FetchLabwareCalibrationsAction = {|
  type: FETCH_LABWARE_CALIBRATIONS,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchLabwareCalibrationsSuccessAction = {|
  type: FETCH_LABWARE_CALIBRATIONS_SUCCESS,
  payload: {|
    robotName: string,
    labwareCalibrations: AllLabwareCalibrations,
  |},
  meta: RobotApiRequestMeta,
|}

export type FetchLabwareCalibrationsFailureAction = {|
  type: FETCH_LABWARE_CALIBRATIONS_FAILURE,
  payload: {| robotName: string, error: RobotApiErrorResponse |},
  meta: RobotApiRequestMeta,
|}

// selector types

export type LabwareSummary = {|
  displayName: string,
  parentDisplayName: string | null,
  quantity: number,
  calibration: {| x: number, y: number, z: number |} | null,
  legacy: boolean,
|}

export type LawareCalibrationAction =
  | FetchLabwareCalibrationsAction
  | FetchLabwareCalibrationsSuccessAction
  | FetchLabwareCalibrationsFailureAction
