// @flow
// api actions
// TODO(mc, 2018-07-02): these generic actions, along with a generic API
// reducer should handle all API state, as opposed to bespoke reducers
// in each API client submodule

import type {BaseRobot} from '../robot'
import type {ApiRequestError} from './types'

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

export function apiRequest<Path: string, Body: ?{}> (
  robot: BaseRobot,
  path: Path,
  request: Body
): ApiRequestAction<Path, Body> {
  return {type: 'api:REQUEST', payload: {robot, path, request}}
}

export function apiSuccess<Path: string, Body: {}> (
  robot: BaseRobot,
  path: Path,
  response: Body
): ApiSuccessAction<Path, Body> {
  return {type: 'api:SUCCESS', payload: {robot, path, response}}
}

export function apiFailure<Path: string> (
  robot: BaseRobot,
  path: Path,
  error: ApiRequestError
): ApiFailureAction<Path> {
  return {type: 'api:FAILURE', payload: {robot, path, error}}
}
