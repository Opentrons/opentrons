// @flow

import { toggleConfigValue, updateConfigValue } from '../config'
import type {
  ToggleConfigValueAction,
  UpdateConfigValueAction,
} from '../config/types'
import * as Constants from './constants'
import * as Types from './types'

import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../robot-api/types'

export const fetchCalibrationStatus = (
  robotName: string
): Types.FetchCalibrationStatusAction => ({
  type: Constants.FETCH_CALIBRATION_STATUS,
  payload: { robotName },
  meta: {},
})

export const fetchCalibrationStatusSuccess = (
  robotName: string,
  calibrationStatus: Types.CalibrationStatus,
  meta: RobotApiRequestMeta
): Types.FetchCalibrationStatusSuccessAction => ({
  type: Constants.FETCH_CALIBRATION_STATUS_SUCCESS,
  payload: { robotName, calibrationStatus },
  meta,
})

export const fetchCalibrationStatusFailure = (
  robotName: string,
  error: RobotApiErrorResponse,
  meta: RobotApiRequestMeta
): Types.FetchCalibrationStatusFailureAction => ({
  type: Constants.FETCH_CALIBRATION_STATUS_FAILURE,
  payload: { robotName, error },
  meta,
})

export function toggleUseTrashSurfaceForTipCal(): ToggleConfigValueAction {
  return toggleConfigValue('calibration.useTrashSurfaceForTipCal')
}

export function setUseTrashSurfaceForTipCal(
  shouldUseTrashSurface: boolean
): UpdateConfigValueAction {
  return updateConfigValue(
    'calibration.useTrashSurfaceForTipCal',
    shouldUseTrashSurface
  )
}
