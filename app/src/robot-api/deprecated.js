// @flow
// DEPRECATED
// do not add to this file
// do not import from this file if you can avoid it
// TODO(mc, 2019-12-13): remove this file
import { of, from, concat } from 'rxjs'
import { switchMap, catchError } from 'rxjs/operators'

import { robotApiUrl } from './http'

import type { Observable } from 'rxjs'
import type { Method, RobotHost, RobotApiResponse } from './types'

type RequestMeta = $Shape<{| [string]: mixed |}>

type RobotApiRequest = {|
  host: RobotHost,
  method: Method,
  path: string,
  body?: mixed,
  query?: { [param: string]: string | boolean | number },
|}

// internal, request lifecycle types
// only for use inside observables
type RobotApiRequestAction = {|
  type: string,
  payload: RobotApiRequest,
  meta: RequestMeta,
|}

export type RobotApiResponseAction = {|
  type: string,
  payload: RobotApiResponse,
  meta: RequestMeta,
|}

const ROBOT_API_ACTION_PREFIX = 'robotApi'
const ROBOT_API_REQUEST_PREFIX = `${ROBOT_API_ACTION_PREFIX}:REQUEST`
const ROBOT_API_RESPONSE_PREFIX = `${ROBOT_API_ACTION_PREFIX}:RESPONSE`
const ROBOT_API_ERROR_PREFIX = `${ROBOT_API_ACTION_PREFIX}:ERROR`

const robotApiRequest = (
  payload: RobotApiRequest,
  meta: RequestMeta
): RobotApiRequestAction => ({
  type: `${ROBOT_API_REQUEST_PREFIX}__${payload.method}__${payload.path}`,
  payload,
  meta,
})

const robotApiResponse = (
  payload: RobotApiResponse,
  meta: RequestMeta
): RobotApiResponseAction => ({
  type: `${ROBOT_API_RESPONSE_PREFIX}__${payload.method}__${payload.path}`,
  payload,
  meta,
})

const robotApiError = (
  payload: RobotApiResponse,
  meta: RequestMeta
): RobotApiResponseAction => ({
  type: `${ROBOT_API_ERROR_PREFIX}__${payload.method}__${payload.path}`,
  payload,
  meta,
})

export const passRobotApiRequestAction = (
  action: any
): RobotApiRequestAction | null =>
  action.type.startsWith(ROBOT_API_REQUEST_PREFIX) ? (action: any) : null

export const passRobotApiResponseAction = (
  action: any
): RobotApiResponseAction | null =>
  action.type.startsWith(ROBOT_API_RESPONSE_PREFIX) ? (action: any) : null

export const passRobotApiErrorAction = (
  action: any
): RobotApiResponseAction | null =>
  action.type.startsWith(ROBOT_API_ERROR_PREFIX) ? (action: any) : null

const robotApiFetch = (
  request: RobotApiRequest
): Observable<RobotApiResponse> => {
  const { host, path, method, body: reqBody } = request
  const url = robotApiUrl(host, { path, method, body: reqBody })
  const options: RequestOptions = { method }

  if (reqBody != null) {
    if (typeof reqBody === 'object') options.body = JSON.stringify(reqBody)
  }

  return from(fetch(url, options)).pipe(
    switchMap(response =>
      response.json().then(body => ({
        host,
        path,
        method,
        body,
        status: response.status,
        ok: response.ok,
      }))
    ),
    catchError(error =>
      of({
        host,
        path,
        method,
        body: { message: error.message },
        status: -1,
        ok: false,
      })
    )
  )
}

export const makeRobotApiRequest = (
  request: RobotApiRequest,
  meta: RequestMeta = {}
): Observable<mixed> => {
  const reqAction = of(robotApiRequest(request, meta))
  const resAction = robotApiFetch(request).pipe(
    switchMap<RobotApiResponse, _, RobotApiResponseAction>(res =>
      of(res.ok ? robotApiResponse(res, meta) : robotApiError(res, meta))
    )
  )

  return concat(reqAction, resAction)
}
