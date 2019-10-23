// @flow
import { GET, POST } from '../robot-api/utils'

import {
  FETCH_SETTINGS,
  UPDATE_SETTING,
  CLEAR_RESTART_REQUIRED,
  SETTINGS_PATH,
} from './constants'

import type { RobotHost } from '../robot-api/types'
import type { RobotSettingsAction } from './types'

export const fetchSettings = (host: RobotHost): RobotSettingsAction => ({
  type: FETCH_SETTINGS,
  payload: { host, method: GET, path: SETTINGS_PATH },
})

export const updateSetting = (
  host: RobotHost,
  settingId: string,
  value: boolean | null
): RobotSettingsAction => ({
  type: UPDATE_SETTING,
  meta: { settingId },
  payload: {
    host,
    method: POST,
    path: SETTINGS_PATH,
    body: { id: settingId, value },
  },
})

export const clearRestartRequired = (
  robotName: string
): RobotSettingsAction => ({
  type: CLEAR_RESTART_REQUIRED,
  payload: { robotName },
})
