// @flow
import {
  getRobotApiState,
  getRobotApiRequestState,
  createBaseRobotApiEpic,
  passRobotApiResponseAction,
  GET,
} from '../utils'

import type { ActionLike, State as AppState } from '../../types'
import type {
  RobotApiAction,
  RobotHost,
  RobotApiRequestState,
  PipettesState as State,
} from '../types'

export const FETCH_PIPETTES: 'robotApi:FETCH_PIPETTES' =
  'robotApi:FETCH_PIPETTES'

export const PIPETTES_PATH = '/pipettes'

export const fetchPipettes = (
  host: RobotHost,
  refresh: boolean = false
): RobotApiAction => ({
  type: FETCH_PIPETTES,
  payload: { host, method: GET, path: PIPETTES_PATH, query: { refresh } },
})

export const pipettesEpic = createBaseRobotApiEpic(FETCH_PIPETTES)

const INITIAL_STATE: State = { left: null, right: null }

export function pipettesReducer(
  state: State = INITIAL_STATE,
  action: ActionLike
): State {
  const resAction = passRobotApiResponseAction(action)

  if (resAction && resAction.payload.path === PIPETTES_PATH) {
    return resAction.payload.body
  }

  return state
}

export function getPipettesState(state: AppState, robotName: string): State {
  return getRobotApiState(state, robotName)?.resources.pipettes || INITIAL_STATE
}

export function getPipettesRequestState(
  state: AppState,
  robotName: string
): RobotApiRequestState | null {
  return getRobotApiRequestState(state, robotName, PIPETTES_PATH)
}
