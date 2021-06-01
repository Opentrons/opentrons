import * as Constants from './constants'

import type { Reducer } from 'redux'
import type { Action } from '../types'
import type { RobotAdminState } from './types'

const INITIAL_STATE: RobotAdminState = {}

export const robotAdminReducer: Reducer<RobotAdminState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case Constants.RESTART_STATUS_CHANGED:
    case Constants.RESTART_FAILURE: {
      // @ts-expect-error TODO: guard type better here, don't do default destructing
      const { robotName, bootId = null, startTime = null } = action.payload
      const restartStatus =
        action.type === Constants.RESTART_FAILURE
          ? Constants.RESTART_FAILED_STATUS
          : action.payload.restartStatus

      const robotState = state[robotName]
      const restartState = {
        bootId: bootId ?? robotState?.restart?.bootId ?? null,
        startTime: startTime ?? robotState?.restart?.startTime ?? null,
        status: restartStatus,
      }

      return {
        ...state,
        [robotName]: { ...robotState, restart: restartState },
      }
    }

    case Constants.FETCH_RESET_CONFIG_OPTIONS_SUCCESS: {
      const { robotName, options } = action.payload
      const robotState = state[robotName]

      return {
        ...state,
        [robotName]: { ...robotState, resetConfigOptions: options },
      }
    }
  }

  return state
}
