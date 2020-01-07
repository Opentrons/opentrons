// @flow
import * as Constants from './constants'
import * as Types from './types'

import type { RobotApiRequestMeta } from '../robot-api/types'

export const fetchSettings = (
  robotName: string
): Types.FetchSettingsAction => ({
  type: Constants.FETCH_SETTINGS,
  payload: { robotName },
  meta: {},
})

export const fetchSettingsSuccess = (
  robotName: string,
  settings: Types.RobotSettings,
  restartPath: string | null,
  meta: RobotApiRequestMeta
): Types.FetchSettingsSuccessAction => ({
  type: Constants.FETCH_SETTINGS_SUCCESS,
  payload: { robotName, settings, restartPath },
  meta,
})

export const fetchSettingsFailure = (
  robotName: string,
  error: {| message: string |},
  meta: RobotApiRequestMeta
): Types.FetchSettingsFailureAction => ({
  type: Constants.FETCH_SETTINGS_FAILURE,
  payload: { robotName, error },
  meta,
})

export const updateSetting = (
  robotName: string,
  settingId: string,
  value: boolean | null
): Types.UpdateSettingAction => ({
  type: Constants.UPDATE_SETTING,
  payload: { robotName, settingId, value },
  meta: {},
})

export const updateSettingSuccess = (
  robotName: string,
  settings: Types.RobotSettings,
  restartPath: string | null,
  meta: RobotApiRequestMeta
): Types.UpdateSettingSuccessAction => ({
  type: Constants.UPDATE_SETTING_SUCCESS,
  payload: { robotName, settings, restartPath },
  meta,
})

export const updateSettingFailure = (
  robotName: string,
  error: {| message: string |},
  meta: RobotApiRequestMeta
): Types.UpdateSettingFailureAction => ({
  type: Constants.UPDATE_SETTING_FAILURE,
  payload: { robotName, error },
  meta,
})

export const clearRestartPath = (
  robotName: string
): Types.ClearRestartPathAction => ({
  type: Constants.CLEAR_RESTART_PATH,
  payload: { robotName },
})
