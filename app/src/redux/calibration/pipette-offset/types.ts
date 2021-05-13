// @flow

import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../../robot-api/types'

import type { AllPipetteOffsetCalibrations } from '../api-types'

import typeof {
  FETCH_PIPETTE_OFFSET_CALIBRATIONS,
  FETCH_PIPETTE_OFFSET_CALIBRATIONS_SUCCESS,
  FETCH_PIPETTE_OFFSET_CALIBRATIONS_FAILURE,
} from './constants'

export type FetchPipetteOffsetCalibrationsAction = {|
  type: FETCH_PIPETTE_OFFSET_CALIBRATIONS,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchPipetteOffsetCalibrationsSuccessAction = {|
  type: FETCH_PIPETTE_OFFSET_CALIBRATIONS_SUCCESS,
  payload: {|
    robotName: string,
    pipetteOffsetCalibrations: AllPipetteOffsetCalibrations,
  |},
  meta: RobotApiRequestMeta,
|}

export type FetchPipetteOffsetCalibrationsFailureAction = {|
  type: FETCH_PIPETTE_OFFSET_CALIBRATIONS_FAILURE,
  payload: {| robotName: string, error: RobotApiErrorResponse |},
  meta: RobotApiRequestMeta,
|}

export type PipetteOffsetCalibrationsAction =
  | FetchPipetteOffsetCalibrationsAction
  | FetchPipetteOffsetCalibrationsFailureAction
  | FetchPipetteOffsetCalibrationsSuccessAction
