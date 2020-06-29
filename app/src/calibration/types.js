// @flow

import type {
  RobotApiErrorResponse,
  RobotApiRequestMeta,
} from '../robot-api/types'
import typeof {
  FETCH_CALIBRATION_STATUS,
  FETCH_CALIBRATION_STATUS_FAILURE,
  FETCH_CALIBRATION_STATUS_SUCCESS,
} from './constants'
import type { CalibrationStatus } from './types'

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
|}>

export type CalibrationState = $ReadOnly<{
  [robotName: string]: PerRobotCalibrationState,
  ...,
}>
