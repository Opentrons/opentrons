// @flow
import { of, concat } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'

import { robotApiFetch } from './http'

import type { Observable } from 'rxjs'
import type { State, Epic, Action, ActionLike } from '../types'
import type {
  Method,
  RobotApiRequest,
  RobotApiResponse,
  RobotApiAction,
  RobotApiActionLike,
  RobotApiRequestAction,
  RobotApiResponseAction,
  RobotApiActionType,
  RobotInstanceApiState,
} from './types'

export const GET: Method = 'GET'
export const POST: Method = 'POST'

export const ROBOT_API_ACTION_PREFIX = 'robotApi'
export const ROBOT_API_REQUEST_PREFIX = `${ROBOT_API_ACTION_PREFIX}:REQUEST`
export const ROBOT_API_RESPONSE_PREFIX = `${ROBOT_API_ACTION_PREFIX}:RESPONSE`
export const ROBOT_API_ERROR_PREFIX = `${ROBOT_API_ACTION_PREFIX}:ERROR`

const robotApiRequest = (payload: RobotApiRequest): RobotApiRequestAction => ({
  type: `${ROBOT_API_REQUEST_PREFIX}__${payload.method}__${payload.path}`,
  payload,
})

const robotApiResponse = (
  payload: RobotApiResponse
): RobotApiResponseAction => ({
  type: `${ROBOT_API_RESPONSE_PREFIX}__${payload.method}__${payload.path}`,
  payload,
})

export const robotApiError = (
  payload: RobotApiResponse
): RobotApiResponseAction => ({
  type: `${ROBOT_API_ERROR_PREFIX}__${payload.method}__${payload.path}`,
  payload,
})

export const passRobotApiAction = (
  action: Action | ActionLike
): RobotApiActionLike | null =>
  action.type.startsWith(ROBOT_API_ACTION_PREFIX) ? (action: any) : null

export const passRobotApiRequestAction = (
  action: ActionLike
): RobotApiRequestAction | null =>
  action.type.startsWith(ROBOT_API_REQUEST_PREFIX) ? (action: any) : null

export const passRobotApiResponseAction = (
  action: ActionLike
): RobotApiResponseAction | null =>
  action.type.startsWith(ROBOT_API_RESPONSE_PREFIX) ? (action: any) : null

export const passRobotApiErrorAction = (
  action: ActionLike
): RobotApiResponseAction | null =>
  action.type.startsWith(ROBOT_API_ERROR_PREFIX) ? (action: any) : null

export const makeRobotApiRequest = (
  request: RobotApiRequest
): Observable<RobotApiRequestAction | RobotApiResponseAction> => {
  const reqAction = of(robotApiRequest(request))
  const resAction = robotApiFetch(request).pipe(
    switchMap<RobotApiResponse, _, RobotApiResponseAction>(res =>
      of(res.ok ? robotApiResponse(res) : robotApiError(res))
    )
  )

  return concat(reqAction, resAction)
}

export const createBaseRobotApiEpic = (
  type: RobotApiActionType
): Epic => action$ =>
  action$.pipe(
    ofType(type),
    switchMap<RobotApiAction, _, RobotApiActionLike>(a =>
      makeRobotApiRequest(a.payload)
    )
  )

export const getRobotApiState = (
  state: State,
  robotName: string
): RobotInstanceApiState | null => state.robotApi[robotName] || null
