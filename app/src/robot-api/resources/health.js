// @flow
import {
  getRobotApiState,
  createBaseRequestEpic,
  passResponseAction,
  GET,
} from '../utils'

import type { ActionLike, State as AppState } from '../../types'
import type { ApiAction, RobotHost, HealthState as State } from '../types'

export const FETCH_HEALTH: 'robotHttp:FETCH_HEALTH' = 'robotHttp:FETCH_HEALTH'

export const HEALTH_PATH = '/health'

export const fetchHealth = (host: RobotHost): ApiAction => ({
  type: FETCH_HEALTH,
  payload: { host, method: GET, path: HEALTH_PATH },
})

export const healthEpic = createBaseRequestEpic(FETCH_HEALTH)

export function healthReducer(state: State = null, action: ActionLike): State {
  const response = passResponseAction(action)

  if (response && response.payload.path === HEALTH_PATH) {
    return ((response.payload.body: any): State)
  }

  return state
}

export function getHealthState(state: AppState, robotName: string): State {
  return getRobotApiState(state, robotName)?.resources.health || null
}
