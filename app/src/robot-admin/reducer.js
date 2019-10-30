// @flow
import mapValues from 'lodash/mapValues'
import { passRobotApiErrorAction } from '../robot-api/utils'
import { DISCOVERY_UPDATE_LIST } from '../discovery/actions'
import {
  RESTART,
  RESTART_PATH,
  RESTART_PENDING_STATUS,
  RESTART_FAILED_STATUS,
  RESTARTING_STATUS,
  UP_STATUS,
  DOWN_STATUS,
} from './constants'

import type { Action, ActionLike } from '../types'
import type { RobotAdminState, PerRobotAdminState } from './types'

const INITIAL_STATE: RobotAdminState = {}

export function robotAdminReducer(
  state: RobotAdminState = INITIAL_STATE,
  action: Action | ActionLike
): RobotAdminState {
  const errAction = passRobotApiErrorAction(action)

  if (errAction) {
    const { host, path } = errAction.payload
    const { name: robotName } = host

    if (path === RESTART_PATH) {
      return { ...state, [robotName]: { status: RESTART_FAILED_STATUS } }
    }
  }

  const strictAction: Action = (action: any)

  switch (strictAction.type) {
    case RESTART: {
      const robotName = strictAction.payload.host.name
      return { ...state, [robotName]: { status: RESTART_PENDING_STATUS } }
    }

    case DISCOVERY_UPDATE_LIST: {
      const { robots } = strictAction.payload
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

          if (up && status !== RESTART_PENDING_STATUS) {
            status = UP_STATUS
          } else if (!up && status === RESTART_PENDING_STATUS) {
            status = RESTARTING_STATUS
          } else if (!up && status !== RESTARTING_STATUS) {
            status = DOWN_STATUS
          }

          return { status }
        }
      )
    }
  }

  return state
}
