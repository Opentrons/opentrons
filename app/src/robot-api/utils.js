// @flow
import { of } from 'rxjs'
import { filter, switchMap } from 'rxjs/operators'
import pathToRegexp from 'path-to-regexp'

import fetch from './fetch'

import type { State, Action, Epic } from '../types'
import type {
  Method,
  ApiCall,
  ApiResponse,
  ApiAction,
  ApiCallAction,
  ApiResponseAction,
  RobotApiState,
} from './types'

export const GET: Method = 'GET'
export const POST: Method = 'POST'

export const API_CALL: 'api:CALL' = 'api:CALL'

export const apiCall = (payload: ApiCall): ApiCallAction => ({
  type: API_CALL,
  payload,
})

export const API_RESPONSE: 'api:RESPONSE' = 'api:RESPONSE'

export const apiResponse = (payload: ApiResponse): ApiResponseAction => ({
  type: API_RESPONSE,
  payload,
})

export const API_ERROR: 'api:ERROR' = 'api:ERROR'

export const apiError = (payload: ApiResponse): ApiAction => ({
  type: API_ERROR,
  payload,
})

export const createBaseRequestEpic = (method: Method, path: string): Epic => {
  const pathMatcher = pathToRegexp(path)

  return action$ =>
    action$.pipe(
      filter<Action, ApiCallAction>(
        a => a.type === API_CALL && pathMatcher.test(a.payload.path)
      ),
      switchMap<ApiCallAction, _, ApiResponse>(a => fetch(a.payload)),
      switchMap<ApiResponse, _, ApiAction>(response =>
        of(response.ok ? apiResponse(response) : apiError(response))
      )
    )
}

export function getRobotApiState(
  state: State,
  robotName: string
): RobotApiState | null {
  return state.robotApi[robotName] || null
}
