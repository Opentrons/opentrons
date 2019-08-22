// @flow
// server endpoints http api module
import { createSelector } from 'reselect'

import client from './client'

import type { OutputSelector } from 'reselect'
import type { State, ThunkPromiseAction, Action } from '../types'
import type { RobotService } from '../robot'
import type { ApiCall, ApiRequestError } from './types'

type RequestPath = 'restart'

export type ServerRestartResponse = {
  message: 'restarting',
}

type ServerResponse = ServerRestartResponse

export type ServerRequestAction = {|
  type: 'api:SERVER_REQUEST',
  payload: {|
    robot: RobotService,
    path: RequestPath,
  |},
|}

export type ServerSuccessAction = {|
  type: 'api:SERVER_SUCCESS',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    response: ServerResponse,
  |},
  meta: {| robot: true |},
|}

export type ServerFailureAction = {|
  type: 'api:SERVER_FAILURE',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    error: ApiRequestError,
  |},
|}

export type ClearServerAction = {|
  type: 'api:CLEAR_SERVER_RESPONSE',
  payload: {|
    robot: RobotService,
    path: RequestPath,
  |},
|}

export type ServerAction =
  | ServerRequestAction
  | ServerSuccessAction
  | ServerFailureAction
  | ClearServerAction

export type RobotServerRestart = ApiCall<void, ServerRestartResponse>

export type RobotServerState = {
  restart?: ?RobotServerRestart,
}

type ServerState = {
  [robotName: string]: ?RobotServerState,
}

const RESTART: RequestPath = 'restart'

export function restartRobotServer(robot: RobotService): ThunkPromiseAction {
  return dispatch => {
    dispatch(serverRequest(robot, RESTART))

    return client(robot, 'POST', 'server/restart').then(
      (response: ServerRestartResponse) =>
        dispatch(serverSuccess(robot, RESTART, response)),
      (error: ApiRequestError) => dispatch(serverFailure(robot, RESTART, error))
    )
  }
}

export function clearRestartResponse(robot: RobotService): * {
  return clearServerResponse(robot, RESTART)
}

export function serverReducer(
  state: ?ServerState,
  action: Action
): ServerState {
  if (state == null) return {}

  let name
  let path
  switch (action.type) {
    case 'api:SERVER_REQUEST':
      ;({
        path,
        robot: { name },
      } = action.payload)

      return {
        ...state,
        [name]: {
          ...state[name],
          [path]: { inProgress: true, response: null, error: null },
        },
      }

    case 'api:SERVER_SUCCESS':
      ;({
        path,
        robot: { name },
      } = action.payload)

      return {
        ...state,
        [name]: {
          ...state[name],
          [path]: {
            response: action.payload.response,
            inProgress: false,
            error: null,
          },
        },
      }

    case 'api:SERVER_FAILURE':
      ;({
        path,
        robot: { name },
      } = action.payload)

      return {
        ...state,
        [name]: {
          ...state[name],
          [path]: {
            error: action.payload.error,
            inProgress: false,
            response: null,
          },
        },
      }

    case 'api:CLEAR_SERVER_RESPONSE':
      ;({
        path,
        robot: { name },
      } = action.payload)
      return {
        ...state,
        [name]: {
          ...state[name],
          [path]: {
            error: null,
            inProgress: false,
            response: null,
          },
        },
      }
  }

  return state
}

export const makeGetRobotRestartRequest = () => {
  const selector: OutputSelector<
    State,
    RobotService,
    RobotServerRestart
  > = createSelector(
    selectRobotServerState,
    state => (state && state.restart) || { inProgress: false }
  )

  return selector
}

function selectServerState(state: State) {
  return state.api.server
}

function selectRobotServerState(state: State, props: RobotService) {
  return selectServerState(state)[props.name]
}

function serverRequest(
  robot: RobotService,
  path: RequestPath
): ServerRequestAction {
  return { type: 'api:SERVER_REQUEST', payload: { robot, path } }
}

function serverSuccess(
  robot: RobotService,
  path: RequestPath,
  response: ServerResponse
): ServerSuccessAction {
  return {
    type: 'api:SERVER_SUCCESS',
    payload: { robot, path, response },
    meta: { robot: true },
  }
}

function serverFailure(
  robot: RobotService,
  path: RequestPath,
  error: ApiRequestError
): ServerFailureAction {
  return { type: 'api:SERVER_FAILURE', payload: { robot, path, error } }
}

function clearServerResponse(
  robot: RobotService,
  path: RequestPath
): ClearServerAction {
  return { type: 'api:CLEAR_SERVER_RESPONSE', payload: { robot, path } }
}
