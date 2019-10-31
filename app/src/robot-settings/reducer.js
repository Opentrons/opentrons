// @flow
import { passRobotApiResponseAction } from '../robot-api/utils'
import { CLEAR_RESTART_PATH, SETTINGS_PATH } from './constants'

import type { Action, ActionLike } from '../types'
import type { RobotSettingsResponse, RobotSettingsState } from './types'

export const INITIAL_STATE: RobotSettingsState = {}

export function robotSettingsReducer(
  state: RobotSettingsState = INITIAL_STATE,
  action: Action | ActionLike
): RobotSettingsState {
  const resAction = passRobotApiResponseAction(action)

  if (resAction) {
    const { payload } = resAction
    const { host, path, body } = payload
    const { name: robotName } = host

    // grabs responses from GET /settings and POST /settings
    // settings in body check is a guard against an old version of GET /settings
    if (path === SETTINGS_PATH && 'settings' in body) {
      const { settings, links } = (body: RobotSettingsResponse)
      // restart is required if `links` comes back with a `restart` field
      const restartPath = links?.restart || null

      return { ...state, [robotName]: { settings, restartPath } }
    }
  }

  const strictAction: Action = (action: any)

  switch (strictAction.type) {
    case CLEAR_RESTART_PATH: {
      const { robotName } = strictAction.payload
      const robotState = state[robotName]

      return { ...state, [robotName]: { ...robotState, restartPath: null } }
    }
  }

  return state
}
