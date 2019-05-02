// @flow
import { of as observableOf, concat as observableConcat } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'

import fetch from './fetch'

import type { State, Epic, Action, ActionLike } from '../types'
import type {
  Method,
  ApiRequest,
  ApiResponse,
  ApiAction,
  ApiActionLike,
  ApiRequestAction,
  ApiResponseAction,
  ApiErrorAction,
  ApiActionType,
  RobotApiState,
} from './types'

export const GET: Method = 'GET'
export const POST: Method = 'POST'

export const API_ACTION_PREFIX = 'robotHttp'
export const API_REQUEST_PREFIX = `${API_ACTION_PREFIX}:REQUEST`
export const API_RESPONSE_PREFIX = `${API_ACTION_PREFIX}:RESPONSE`
export const API_ERROR_PREFIX = `${API_ACTION_PREFIX}:ERROR`

const apiRequest = (payload: ApiRequest): ApiRequestAction => ({
  type: `${API_REQUEST_PREFIX}__${payload.method}__${payload.path}`,
  payload,
})

const apiResponse = (payload: ApiResponse): ApiResponseAction => ({
  type: `${API_RESPONSE_PREFIX}__${payload.method}__${payload.path}`,
  payload,
})

const apiError = (payload: ApiResponse): ApiErrorAction => ({
  type: `${API_ERROR_PREFIX}__${payload.method}__${payload.path}`,
  payload,
})

export const passApiAction = (
  action: Action | ActionLike
): ApiActionLike | null =>
  action.type.startsWith(API_ACTION_PREFIX) ? (action: any) : null

export const passRequestAction = (
  action: ActionLike
): ApiRequestAction | null =>
  action.type.startsWith(API_REQUEST_PREFIX) ? (action: any) : null

export const passResponseAction = (
  action: ActionLike
): ApiResponseAction | null =>
  action.type.startsWith(API_RESPONSE_PREFIX) ? (action: any) : null

export const passErrorAction = (action: ActionLike): ApiErrorAction | null =>
  action.type.startsWith(API_ERROR_PREFIX) ? (action: any) : null

export const createBaseRequestEpic = (type: ApiActionType): Epic => {
  return action$ =>
    action$.pipe(
      ofType(type),
      switchMap<ApiAction, _, _>(a => {
        const requestAction = observableOf(apiRequest(a.payload))
        const responseAction = fetch(a.payload).pipe(
          switchMap<ApiResponse, _, ApiActionLike>(resp =>
            observableOf(resp.ok ? apiResponse(resp) : apiError(resp))
          )
        )

        return observableConcat(requestAction, responseAction)
      })
    )
}

export function getRobotApiState(
  state: State,
  robotName: string
): RobotApiState | null {
  return state.robotApi[robotName] || null
}
