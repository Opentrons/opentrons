// @flow

import type { LabwareDefinition2, ModuleModel } from '@opentrons/shared-data'
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

export type LabwareCalibrationData = {| x: number, y: number, z: number |}
export type LabwareSummary = {|
  displayName: string,
  parentDisplayName: string | null,
  quantity: number,
  calibration: LabwareCalibrationData | null,
  legacy: boolean,
|}

export type LawareCalibrationAction =
  | FetchLabwareCalibrationsAction
  | FetchLabwareCalibrationsSuccessAction
  | FetchLabwareCalibrationsFailureAction

export type BaseProtocolLabware = {|
  definition: LabwareDefinition2 | null,
  loadName: string,
  namespace: string | null,
  version: number | null,
  parent: ModuleModel | null,
  legacy: boolean,
|}
