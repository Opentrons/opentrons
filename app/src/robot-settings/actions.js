// @flow
import { GET, POST } from '../robot-api/utils'

import {
  FETCH_SETTINGS,
  UPDATE_SETTING,
  CLEAR_RESTART_PATH,
  SETTINGS_PATH,
} from './constants'

import type { RobotHost } from '../robot-api/types'
import type { RobotSettingsApiAction, ClearRestartPathAction } from './types'

export const fetchSettings = (host: RobotHost): RobotSettingsApiAction => ({
  type: FETCH_SETTINGS,
  payload: { host, method: GET, path: SETTINGS_PATH },
})

export const updateSetting = (
  host: RobotHost,
  settingId: string,
  value: boolean | null
): RobotSettingsApiAction => ({
  type: UPDATE_SETTING,
  payload: {
    host,
    method: POST,
    path: SETTINGS_PATH,
    body: { id: settingId, value },
  },
})

export const clearRestartPath = (
  robotName: string
): ClearRestartPathAction => ({
  type: CLEAR_RESTART_PATH,
  payload: { robotName },
})
