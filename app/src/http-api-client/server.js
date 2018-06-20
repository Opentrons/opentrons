// @flow
// server endpoints http api module
import {remote} from 'electron'
import {createSelector, type Selector} from 'reselect'
import {chainActions} from '../util'
import type {State, ThunkPromiseAction, Action} from '../types'
import type {RobotService} from '../robot'

import type {ApiCall} from './types'
import client, {FetchError, type ApiRequestError} from './client'
import {fetchHealth} from './health'
import {fetchIgnoredUpdate} from './ignored-update'

// remote module paths relative to app-shell/lib/main.js
const {AVAILABLE_UPDATE, getUpdateFiles} = remote.require('./api-update')

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

export type RobotServerState = {
  update?: ?RobotServerUpdate,
  restart?: ?RobotServerRestart,
  availableUpdate?: ?string,
  ignored?: ?string,
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

    return getUpdateRequestBody()
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

export function fetchHealthAndIgnored (robot: RobotService): * {
  return chainActions(
    fetchHealth(robot),
    fetchIgnoredUpdate(robot)
  )
}

export function serverReducer (
  state: ?ServerState,
  action: Action
): ServerState {
  if (state == null) return {}

  let name
  let path
  switch (action.type) {
    case 'api:SERVER_REQUEST':
      ({path, robot: {name}} = action.payload)

      return {
        ...state,
        [name]: {
          ...state[name],
          [path]: {inProgress: true, response: null, error: null}
        }
      }

    case 'api:SERVER_SUCCESS':
      ({path, robot: {name}} = action.payload)

      return {
        ...state,
        [name]: {
          ...state[name],
          [path]: {
            response: action.payload.response,
            inProgress: false,
            error: null
          }
        }
      }

    case 'api:SERVER_FAILURE':
      ({path, robot: {name}} = action.payload)

      return {
        ...state,
        [name]: {
          ...state[name],
          [path]: {
            error: action.payload.error,
            inProgress: false,
            response: null
          }
        }
      }

    case 'api:HEALTH_SUCCESS':
      ({robot: {name}} = action.payload)
      let stateByName = state[name]
      const previousUpdate = stateByName && stateByName.availableUpdate
      const currentVersion = action.payload.health.api_version
      const availableUpdate = currentVersion !== AVAILABLE_UPDATE
        ? AVAILABLE_UPDATE
        : null

      if (availableUpdate !== previousUpdate) {
        stateByName = {...stateByName, update: null, restart: null}
      }

      return {...state, [name]: {...stateByName, availableUpdate}}

    case 'api:IGNORED_UPDATE_SUCCESS':
      ({robot: {name}} = action.payload)
      const version = action.payload.version.version
      return {...state, [name]: {...state[name], ignored: version}}
  }

  return state
}

export const makeGetAvailableRobotUpdate = () => {
  const selector: Selector<State, RobotService, ?string> = createSelector(
    selectRobotServerState,
    (state) => (state && state.availableUpdate) || null
  )

  return selector
}

export const makeGetRobotUpdateRequest = () => {
  const selector: Selector<State, RobotService, RobotServerUpdate> =
    createSelector(
      selectRobotServerState,
      (state) => (state && state.update) || {inProgress: false}
    )

  return selector
}

export const makeGetRobotRestartRequest = () => {
  const selector: Selector<State, RobotService, RobotServerRestart> =
    createSelector(
      selectRobotServerState,
      (state) => (state && state.restart) || {inProgress: false}
    )

  return selector
}

export const getAnyRobotUpdateAvailable: Selector<State, void, boolean> =
  createSelector(
    selectServerState,
    (state) => Object.keys(state).some((name) => state[name].availableUpdate)
  )

function selectServerState (state: State) {
  return state.api.server
}

function selectRobotServerState (state: State, props: RobotService) {
  return selectServerState(state)[props.name]
}

function getUpdateRequestBody () {
  return getUpdateFiles()
    .then(files => {
      const formData = new FormData()
      files.forEach(f => formData.append(f.id, new Blob([f.contents]), f.name))
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
