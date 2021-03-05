// @flow
// robot discovery state
import keyBy from 'lodash/keyBy'
import { UI_INITIALIZED } from '../shell'
import { RESTART_SUCCESS } from '../robot-admin'
import * as Constants from './constants'
import * as actions from './actions'

import type { Action } from '../types'
import type { DiscoveryState } from './types'

export const INITIAL_STATE: DiscoveryState = {
  scanning: false,
  robotsByName: {},
  restartingByName: {},
}

export function discoveryReducer(
  state: DiscoveryState = INITIAL_STATE,
  action: Action
): DiscoveryState {
  switch (action.type) {
    case UI_INITIALIZED:
    case actions.DISCOVERY_START:
      return { ...state, scanning: true }

    case actions.DISCOVERY_FINISH:
      return { ...state, scanning: false }

    case actions.DISCOVERY_UPDATE_LIST: {
      const robotsByName = keyBy(action.payload.robots, 'name')

      // if we have any robots that we are tracking restarts for, use bootId
      // (if present) or health status set restart status accordingly
      const restartingByName = Object.keys(state.restartingByName).reduce(
        (restartMap, robotName) => {
          const nextRobotState = robotsByName[robotName]
          const restartState = restartMap[robotName]
          const { bootId: prevBootId, status: restartStatus } = restartState

          const apiServerIsUp =
            nextRobotState?.addresses[0]?.healthStatus ===
            Constants.HEALTH_STATUS_OK

          const bootId = nextRobotState?.serverHealth?.bootId ?? null

          if (bootId !== null && bootId !== prevBootId) {
            // if the health server has reported a boot ID and it's different
            // than the last one, then the robot has restarted
            restartMap[robotName] = { ...restartState, status: null }
          } else if (
            restartStatus === Constants.RESTART_PENDING_STATUS &&
            !apiServerIsUp
          ) {
            // if the robot has a restart pending, and we notice that it is no
            // longer responding on its health endpoint, then we can mark it
            // restarting
            restartMap[robotName] = {
              ...restartState,
              status: Constants.RESTARTING_STATUS,
            }
          } else if (
            restartStatus === Constants.RESTARTING_STATUS &&
            apiServerIsUp
          ) {
            // if the robot is marked as restarting and we notice it is back
            // online (and we didn't have a boot ID to check), optimistically
            // mark it as no longer restarting
            restartMap[robotName] = { ...restartState, status: null }
          }

          return restartMap
        },
        { ...state.restartingByName }
      )

      return { ...state, robotsByName, restartingByName }
    }

    case RESTART_SUCCESS: {
      const { robotName } = action.payload
      const robotState = state.robotsByName[robotName]
      const restartingByName = {
        ...state.restartingByName,
        [robotName]: {
          bootId: robotState?.serverHealth?.bootId ?? null,
          status: Constants.RESTART_PENDING_STATUS,
        },
      }

      return { ...state, restartingByName }
    }
  }

  return state
}
