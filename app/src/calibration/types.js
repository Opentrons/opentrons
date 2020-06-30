// @flow

import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../robot-api/types'

import type { CalibrationStatus } from './types'

import typeof {
  FETCH_CALIBRATION_STATUS,
  FETCH_CALIBRATION_STATUS_SUCCESS,
  FETCH_CALIBRATION_STATUS_FAILURE,
} from './constants'

export * from './api-types'

export type FetchCalibrationStatusAction = {|
  type: FETCH_CALIBRATION_STATUS,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchCalibrationStatusSuccessAction = {|
  type: FETCH_CALIBRATION_STATUS_SUCCESS,
  payload: {|
    robotName: string,
    calibrationStatus: CalibrationStatus,
  |},
  meta: RobotApiRequestMeta,
|}

export type FetchCalibrationStatusFailureAction = {|
  type: FETCH_CALIBRATION_STATUS_FAILURE,
  payload: {| robotName: string, error: RobotApiErrorResponse |},
  meta: RobotApiRequestMeta,
|}

export type CalibrationAction =
  | FetchCalibrationStatusAction
  | FetchCalibrationStatusSuccessAction
  | FetchCalibrationStatusFailureAction

export type PerRobotCalibrationState = $ReadOnly<{|
  calibrationStatus: CalibrationStatus,
  // add stuff here
|}>

export type CalibrationState = $ReadOnly<{
  [robotName: string]: PerRobotCalibrationState,
  ...,
}>
