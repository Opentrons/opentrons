// @flow
import {
  getRobotApiState,
  createBaseRequestEpic,
  apiCall,
  GET,
  API_RESPONSE,
} from '../utils'

import type { State as AppState } from '../../types'
import type { ApiAction, RobotHost, HealthState as State } from '../types'

export const HEALTH_PATH = '/health'

export const fetchHealth = (host: RobotHost) =>
  apiCall({ method: GET, path: HEALTH_PATH, host })

export const healthEpic = createBaseRequestEpic(GET, HEALTH_PATH)

export function healthReducer(state: State = null, action: ApiAction): State {
  if (action.type === API_RESPONSE && action.payload.path === HEALTH_PATH) {
    return ((action.payload.body: any): State)
  }

  return state
}

export function getHealthState(state: AppState, robotName: string): State {
  return getRobotApiState(state, robotName)?.resources.health || null
}
