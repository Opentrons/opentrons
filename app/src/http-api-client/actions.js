// @flow
// api actions
// TODO(mc, 2018-07-02): these generic actions, along with a generic API
// reducer should handle all API state, as opposed to bespoke reducers
// in each API client submodule

import type { ThunkPromiseAction } from '../types'
import type { BaseRobot, RobotService } from '../robot'
import { client } from './client'
import type { ApiRequestError } from './types'
import type { Method } from './client'

export type ApiRequestAction<Path: string, Body: ?{}> = {|
  type: 'api:REQUEST',
  payload: {|
    robot: BaseRobot,
    path: Path,
    request: Body,
  |},
|}

export type ApiSuccessAction<Path: string, Body: {}> = {|
  type: 'api:SUCCESS',
  payload: {|
    robot: BaseRobot,
    path: Path,
    response: Body,
  |},
|}

export type ApiFailureAction<Path: string> = {|
  type: 'api:FAILURE',
  payload: {|
    robot: BaseRobot,
    path: Path,
    error: ApiRequestError,
  |},
|}

export type ClearApiResponseAction<Path: string> = {|
  type: 'api:CLEAR_RESPONSE',
  payload: {|
    robot: BaseRobot,
    path: Path,
  |},
|}

export type ApiAction<Path: string, Request: ?{}, Response: {}> =
  | ApiRequestAction<Path, Request>
  | ApiSuccessAction<Path, Response>
  | ApiFailureAction<Path>
  | ClearApiResponseAction<Path>

export type RequestMaker<Request: ?{} = void> = (
  robot: RobotService,
  request: Request
) => ThunkPromiseAction

// thunk action creator creator (sorry) for making API calls
// e.g. export const fetchHealth = buildRequestMaker('GET', 'health')
export function buildRequestMaker<Request: ?{}>(
  method: Method,
  path: string
): RequestMaker<Request> {
  return (robot, request = null) => dispatch => {
    // $FlowFixMe: (mc, 2019-04-17): http-api-client types need to be redone
    dispatch(apiRequest(robot, path, request))

    return (
      client(robot, method, path, request)
        .then(
          response => apiSuccess(robot, path, response),
          error => apiFailure(robot, path, error)
        )
        // $FlowFixMe: (mc, 2019-04-17): http-api-client types need to be redone
        .then(dispatch)
    )
  }
}

export function apiRequest<Path: string, Body: ?{}>(
  robot: BaseRobot,
  path: Path,
  request: Body
): ApiRequestAction<Path, Body> {
  return { type: 'api:REQUEST', payload: { robot, path, request } }
}

export function apiSuccess<Path: string, Body: {}>(
  robot: BaseRobot,
  path: Path,
  response: Body
): ApiSuccessAction<Path, Body> {
  return { type: 'api:SUCCESS', payload: { robot, path, response } }
}

export function apiFailure<Path: string>(
  robot: BaseRobot,
  path: Path,
  error: ApiRequestError
): ApiFailureAction<Path> {
  return { type: 'api:FAILURE', payload: { robot, path, error } }
}

export function clearApiResponse<Path: string>(
  robot: BaseRobot,
  path: Path
): ClearApiResponseAction<Path> {
  return { type: 'api:CLEAR_RESPONSE', payload: { robot, path } }
}
