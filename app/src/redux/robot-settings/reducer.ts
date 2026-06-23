import * as Constants from './constants'

import type { Reducer } from 'redux'
import type { Action } from '../types'
import type { RobotSettingsState } from './types'

export const INITIAL_STATE: RobotSettingsState = {}

export const robotSettingsReducer: Reducer<RobotSettingsState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case Constants.FETCH_SETTINGS_SUCCESS:
    case Constants.UPDATE_SETTING_SUCCESS: {
      const { robotName, settings } = action.payload

      return { ...state, [robotName]: { settings } }
    }
  }

  return state
}
