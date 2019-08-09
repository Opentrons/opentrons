// @flow
import { of } from 'rxjs'

import { combineEpics, ofType } from 'redux-observable'
import { switchMap, withLatestFrom, filter } from 'rxjs/operators'

import { getConnectedRobot } from '../../discovery'
import type { ActionLike, State as AppState } from '../../types'
import type {
  RobotApiAction,
  RobotHost,
  RobotApiRequestState,
  PipettesState as State,
} from '../types'
import {
  getRobotApiState,
  getRobotApiRequestState,
  createBaseRobotApiEpic,
  passRobotApiResponseAction,
  GET,
} from '../utils'

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

const eagerlyLoadPipettesEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType('robot:CONNECT_RESPONSE'),
    filter(action => !action.payload?.error),
    withLatestFrom(state$),
    switchMap<[ConnectResponseAction, State], _, mixed>(([action, state]) => {
      return of(fetchPipettes(getConnectedRobot(state)))
    })
  )

export const pipettesEpic = combineEpics(
  createBaseRobotApiEpic(FETCH_PIPETTES),
  eagerlyLoadPipettesEpic
)

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
