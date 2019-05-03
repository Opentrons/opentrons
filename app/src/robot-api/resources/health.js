// @flow
import {
  getRobotApiState,
  createBaseRobotApiEpic,
  passRobotApiResponseAction,
  GET,
} from '../utils'

import type { ActionLike, State as AppState } from '../../types'
import type { RobotApiAction, RobotHost, HealthState as State } from '../types'

export const FETCH_HEALTH: 'robotApi:FETCH_HEALTH' = 'robotApi:FETCH_HEALTH'

export const HEALTH_PATH = '/health'

export const fetchHealth = (host: RobotHost): RobotApiAction => ({
  type: FETCH_HEALTH,
  payload: { host, method: GET, path: HEALTH_PATH },
})

export const healthEpic = createBaseRobotApiEpic(FETCH_HEALTH)

export function healthReducer(state: State = null, action: ActionLike): State {
  const resAction = passRobotApiResponseAction(action)

  if (resAction && resAction.payload.path === HEALTH_PATH) {
    return ((resAction.payload.body: any): State)
  }

  return state
}

export function getHealthState(state: AppState, robotName: string): State {
  return getRobotApiState(state, robotName)?.resources.health || null
}
