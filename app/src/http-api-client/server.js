// @flow
// server endpoints http api module
import {remote} from 'electron'
import {createSelector} from 'reselect'

import type {State, ThunkPromiseAction, Action} from '../types'
import type {RobotService} from '../robot'

import type {ApiCall} from './types'
import client, {FetchError, type ApiRequestError} from './client'

// remote module paths relative to app-shell/lib/main.js
const {getUpdateAvailable, getUpdateFile} = remote.require('./api-update')

type RequestPath = 'update' | 'restart'

export type ServerUpdateResponse = {
  filename: string,
  message: string,
}

export type ServerRestartResponse = {
  message: 'restarting',
}

type ServerResponse =
  | ServerUpdateResponse
  | ServerRestartResponse

export type ServerRequestAction = {|
  type: 'api:SERVER_REQUEST',
  payload: {|
    robot: RobotService,
    path: RequestPath,
  |}
|}

export type ServerSuccessAction = {|
  type: 'api:SERVER_SUCCESS',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    response: ServerResponse,
  |}
|}

export type ServerFailureAction = {|
  type: 'api:SERVER_FAILURE',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    error: ApiRequestError,
  |}
|}

export type ServerAction =
  | ServerRequestAction
  | ServerSuccessAction
  | ServerFailureAction

export type RobotServerUpdate = ApiCall<void, ServerUpdateResponse>
export type RobotServerRestart = ApiCall<void, ServerRestartResponse>

type RobotServerState = {
  update?: ?RobotServerUpdate,
  restart?: ?RobotServerRestart,
  updateAvailable?: boolean
}

type ServerState = {
  [robotName: string]: ?RobotServerState
}

const UPDATE: RequestPath = 'update'
const RESTART: RequestPath = 'restart'

// TODO(mc, 2018-03-16): remove debug code when UI is hooked up
// global.updateRobotServer = updateRobotServer

export function updateRobotServer (
  robot: RobotService
): ThunkPromiseAction {
  return (dispatch) => {
    dispatch(serverRequest(robot, UPDATE))

    return makeUpdateRequestBody()
      .then((body) => client(robot, 'POST', 'server/update', body))
      .then(
        (response: ServerUpdateResponse) =>
          dispatch(serverSuccess(robot, UPDATE, response)),
        (error: ApiRequestError) =>
          dispatch(serverFailure(robot, UPDATE, error))
      )
  }
}

export function restartRobotServer (
  robot: RobotService
): ThunkPromiseAction {
  return (dispatch) => {
    dispatch(serverRequest(robot, RESTART))

    return client(robot, 'POST', 'server/restart')
      .then(
        (response: ServerRestartResponse) =>
          dispatch(serverSuccess(robot, RESTART, response)),
        (error: ApiRequestError) =>
          dispatch(serverFailure(robot, RESTART, error))
      )
  }
}

export function serverReducer (
  state: ?ServerState,
  action: Action
): ServerState {
  if (state == null) return {}

  let robotName
  switch (action.type) {
    case 'api:HEALTH_SUCCESS':
      robotName = action.payload.robot.name

      return {
        ...state,
        [robotName]: {
          ...state[robotName],
          updateAvailable: getUpdateAvailable(
            action.payload.health.api_version
          )
        }
      }
  }

  return state
}

export const makeGetRobotUpdateAvailable = () => createSelector(
  selectRobotServerState,
  (state: ?RobotServerState): boolean => !!(state && state.updateAvailable)
)

function selectRobotServerState (state: State, props: RobotService) {
  return state.api.server[props.name]
}

function makeUpdateRequestBody () {
  return getUpdateFile()
    .then((file) => {
      const formData = new FormData()
      formData.append('whl', new Blob([file.contents]), file.name)
      return formData
    })
    .catch((error) => Promise.reject(FetchError(error)))
}

function serverRequest (
  robot: RobotService,
  path: RequestPath
): ServerRequestAction {
  return {type: 'api:SERVER_REQUEST', payload: {robot, path}}
}

function serverSuccess (
  robot: RobotService,
  path: RequestPath,
  response: ServerResponse
): ServerSuccessAction {
  return {
    type: 'api:SERVER_SUCCESS',
    payload: {robot, path, response}
  }
}

function serverFailure (
  robot: RobotService,
  path: RequestPath,
  error: ApiRequestError
): ServerFailureAction {
  return {type: 'api:SERVER_FAILURE', payload: {robot, path, error}}
}
