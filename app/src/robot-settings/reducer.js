// @flow
import { passRobotApiResponseAction, POST } from '../robot-api/utils'
import { RESTART } from '../robot-admin'
import { CLEAR_RESTART_REQUIRED, SETTINGS_PATH } from './constants'

import type { Action, ActionLike } from '../types'
import type { RobotSettings, RobotSettingsState } from './types'

export const INITIAL_STATE: RobotSettingsState = {}

export function robotSettingsReducer(
  state: RobotSettingsState = INITIAL_STATE,
  action: Action | ActionLike
): RobotSettingsState {
  const resAction = passRobotApiResponseAction(action)

  if (resAction) {
    const { payload, meta } = resAction
    const { host, method, path, body } = payload
    const { name: robotName } = host

    // grabs responses from GET /settings and POST /settings
    // settings in body check is a guard against an old version of GET /settings
    if (path === SETTINGS_PATH && 'settings' in body) {
      const robotState = state[robotName]
      const settings: RobotSettings = body.settings
      // restart is required if the setting we just updated (meta.settingId)
      // is a restart_required setting, or if restart was already required
      const restartRequired =
        Boolean(robotState?.restartRequired) ||
        (method === POST &&
          settings.some(
            s => s.id === meta.settingId && s.restart_required === true
          ))

      return { ...state, [robotName]: { settings, restartRequired } }
    }
  }

  switch (action.type) {
    case CLEAR_RESTART_REQUIRED: {
      const { robotName } = action.payload

      return {
        ...state,
        [robotName]: { ...state[robotName], restartRequired: false },
      }
    }

    case RESTART: {
      const { name: robotName } = action.payload.host

      return {
        ...state,
        [robotName]: { ...state[robotName], restartRequired: false },
      }
    }
  }

  return state
}
