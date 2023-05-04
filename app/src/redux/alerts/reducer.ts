import type { Action } from '../types'
import * as Constants from './constants'
import type { AlertsState } from './types'
import union from 'lodash/union'
import without from 'lodash/without'
import type { Reducer } from 'redux'

const INITIAL_STATE = {
  active: [],
  ignored: [],
}

export const alertsReducer: Reducer<AlertsState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case Constants.ALERT_TRIGGERED: {
      const { active, ignored } = state
      const { alertId } = action.payload
      return !ignored.includes(alertId) && !active.includes(alertId)
        ? { ...state, active: [...active, alertId] }
        : state
    }

    case Constants.ALERT_DISMISSED: {
      const { alertId } = action.payload
      return {
        ...state,
        active: without(state.active, alertId),
        ignored: union(state.ignored, [alertId]),
      }
    }
  }

  return state
}
