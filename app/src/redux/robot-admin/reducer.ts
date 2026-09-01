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
    case Constants.RESTART_STATUS_CHANGED: {
      const { robotName, bootId, startTime, restartStatus } = action.payload

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
  }

  return state
}
