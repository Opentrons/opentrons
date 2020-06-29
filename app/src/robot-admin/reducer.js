// @flow
import mapValues from 'lodash/mapValues'

import { DISCOVERY_UPDATE_LIST } from '../discovery/actions'
import type { Action } from '../types'
import * as Constants from './constants'
import type { PerRobotAdminState, RobotAdminState } from './types'

const INITIAL_STATE: RobotAdminState = {}

export function robotAdminReducer(
  state: RobotAdminState = INITIAL_STATE,
  action: Action
): RobotAdminState {
  switch (action.type) {
    case Constants.RESTART: {
      const { robotName } = action.payload
      const robotState = state[robotName]

      return {
        ...state,
        [robotName]: {
          ...robotState,
          status: Constants.RESTART_PENDING_STATUS,
        },
      }
    }

    case Constants.RESTART_FAILURE: {
      const { robotName } = action.payload
      const robotState = state[robotName]

      return {
        ...state,
        [robotName]: {
          ...robotState,
          status: Constants.RESTART_FAILED_STATUS,
        },
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

    case DISCOVERY_UPDATE_LIST: {
      const { robots } = action.payload
      const upByName = robots.reduce<$Shape<{| [string]: boolean | void |}>>(
        (result, service) => ({
          ...result,
          [service.name]: result[service.name] || service.ok,
        }),
        {}
      )

      return mapValues(
        state,
        (robotState: PerRobotAdminState, robotName: string) => {
          let { status } = robotState
          const up = upByName[robotName]

          if (up && status !== Constants.RESTART_PENDING_STATUS) {
            status = Constants.UP_STATUS
          } else if (!up && status === Constants.RESTART_PENDING_STATUS) {
            status = Constants.RESTARTING_STATUS
          } else if (!up && status !== Constants.RESTARTING_STATUS) {
            status = Constants.DOWN_STATUS
          }

          return { ...robotState, status }
        }
      )
    }
  }

  return state
}
