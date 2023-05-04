import type { Action } from '../types'
import * as Constants from './constants'
import type { RobotSettingsState, PerRobotRobotSettingsState } from './types'
import type { Reducer } from 'redux'

export const INITIAL_STATE: RobotSettingsState = {}

const INITIAL_ROBOT_STATE: PerRobotRobotSettingsState = {
  settings: [],
  restartPath: null,
}

export const robotSettingsReducer: Reducer<RobotSettingsState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case Constants.FETCH_SETTINGS_SUCCESS:
    case Constants.UPDATE_SETTING_SUCCESS: {
      const { robotName, settings, restartPath } = action.payload

      return { ...state, [robotName]: { settings, restartPath } }
    }

    case Constants.CLEAR_RESTART_PATH: {
      const { robotName } = action.payload
      const robotState = state[robotName] || INITIAL_ROBOT_STATE

      return { ...state, [robotName]: { ...robotState, restartPath: null } }
    }
  }

  return state
}
