// @flow
// server endpoints http api module
import {createSelector} from 'reselect'
import semver from 'semver'

import {chainActions} from '../util'
import client, {FetchError} from './client'
import {fetchHealth, makeGetRobotHealth} from './health'
import {
  getApiUpdateVersion,
  getApiUpdateFilename,
  getApiUpdateContents,
} from '../shell'

import type {OutputSelector} from 'reselect'
import type {State, ThunkPromiseAction, Action} from '../types'
import type {RobotService} from '../robot'
import type {ApiCall, ApiRequestError} from './types'

type RequestPath = 'update' | 'restart' | 'update/ignore'

export type ServerUpdateResponse = {
  filename: string,
  message: string,
}

export type ServerRestartResponse = {
  message: 'restarting',
}

export type ServerUpdateIgnoreResponse = {
  version: ?string,
}

type ServerResponse =
  | ServerUpdateResponse
  | ServerRestartResponse
  | ServerUpdateIgnoreResponse

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

export type RobotServerUpdate = ApiCall<void, ServerUpdateResponse>
export type RobotServerRestart = ApiCall<void, ServerRestartResponse>
export type RobotServerUpdateIgnore = ApiCall<void, ServerUpdateIgnoreResponse>

export type RobotServerState = {
  update?: ?RobotServerUpdate,
  restart?: ?RobotServerRestart,
  availableUpdate?: ?string,
  'update/ignore': ?RobotServerUpdateIgnore,
}

type ServerState = {
  [robotName: string]: ?RobotServerState,
}

const UPDATE: RequestPath = 'update'
const RESTART: RequestPath = 'restart'
const IGNORE: RequestPath = 'update/ignore'

export function updateRobotServer (robot: RobotService): ThunkPromiseAction {
  return (dispatch, getState) => {
    dispatch(serverRequest(robot, UPDATE))

    return getUpdateRequestBody(getState())
      .then(body => client(robot, 'POST', 'server/update', body))
      .then(
        (response: ServerUpdateResponse) =>
          dispatch(serverSuccess(robot, UPDATE, response)),
        (error: ApiRequestError) =>
          dispatch(serverFailure(robot, UPDATE, error))
      )
  }
}

export function clearUpdateResponse (robot: RobotService): * {
  return clearServerResponse(robot, UPDATE)
}

export function restartRobotServer (robot: RobotService): ThunkPromiseAction {
  return dispatch => {
    dispatch(serverRequest(robot, RESTART))

    return client(robot, 'POST', 'server/restart').then(
      (response: ServerRestartResponse) =>
        dispatch(serverSuccess(robot, RESTART, response)),
      (error: ApiRequestError) => dispatch(serverFailure(robot, RESTART, error))
    )
  }
}

export function clearRestartResponse (robot: RobotService): * {
  return clearServerResponse(robot, RESTART)
}

export function fetchHealthAndIgnored (robot: RobotService): * {
  return chainActions(fetchHealth(robot), fetchIgnoredUpdate(robot))
}

export function fetchIgnoredUpdate (robot: RobotService): ThunkPromiseAction {
  return dispatch => {
    dispatch(serverRequest(robot, IGNORE))

    return client(robot, 'GET', 'update/ignore').then(
      (response: ServerRestartResponse) =>
        dispatch(serverSuccess(robot, IGNORE, response)),
      (error: ApiRequestError) => dispatch(serverFailure(robot, IGNORE, error))
    )
  }
}

export function setIgnoredUpdate (
  robot: RobotService,
  version: ?string
): ThunkPromiseAction {
  return dispatch => {
    const body = {version}
    dispatch(serverRequest(robot, IGNORE))

    return client(robot, 'POST', 'update/ignore', body).then(
      (response: ServerRestartResponse) =>
        dispatch(serverSuccess(robot, IGNORE, response)),
      (error: ApiRequestError) => dispatch(serverFailure(robot, IGNORE, error))
    )
  }
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
      ;({
        path,
        robot: {name},
      } = action.payload)

      return {
        ...state,
        [name]: {
          ...state[name],
          [path]: {inProgress: true, response: null, error: null},
        },
      }

    case 'api:SERVER_SUCCESS':
      ;({
        path,
        robot: {name},
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
        robot: {name},
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
        robot: {name},
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

export type RobotUpdateType = 'upgrade' | 'downgrade' | null

export type RobotUpdateInfo = {version: string, type: RobotUpdateType}

export const makeGetRobotUpdateInfo = () => {
  const selector: OutputSelector<State, RobotService, RobotUpdateInfo> = createSelector(
    makeGetRobotHealth(),
    getApiUpdateVersion,
    (health, updateVersion) => {
      const current = health.response && health.response.api_version
      const upgrade = current && semver.gt(updateVersion, current)
      const downgrade = current && semver.lt(updateVersion, current)
      let type
      if (!current || (!upgrade && !downgrade)) {
        type = null
      } else {
        type = upgrade
          ? 'upgrade'
          : 'downgrade'
      }
      return {version: updateVersion, type: type}
    }
  )

  return selector
}

// TODO(mc, 2018-09-25): this is broken until some planned discovery work is
// done for https://github.com/Opentrons/opentrons/milestone/68
export const makeGetRobotUpdateRequest = () => {
  const selector: OutputSelector<State,
    RobotService,
    RobotServerUpdate> = createSelector(
    selectRobotServerState,
    state => (state && state.update) || {inProgress: false}
  )

  return selector
}

export const makeGetRobotRestartRequest = () => {
  const selector: OutputSelector<State,
    RobotService,
    RobotServerRestart> = createSelector(
    selectRobotServerState,
    state => (state && state.restart) || {inProgress: false}
  )

  return selector
}

export const makeGetRobotIgnoredUpdateRequest = () => {
  const selector: OutputSelector<State,
    RobotService,
    RobotServerUpdateIgnore> = createSelector(
    selectRobotServerState,
    state => (state && state['update/ignore']) || {inProgress: false}
  )

  return selector
}

export const getAnyRobotUpdateAvailable: OutputSelector<State,
  void,
  boolean> = createSelector(selectServerState, state =>
  Object.keys(state).some(name => state[name].availableUpdate)
)

function selectServerState (state: State) {
  return state.api.server
}

function selectRobotServerState (state: State, props: RobotService) {
  return selectServerState(state)[props.name]
}

function getUpdateRequestBody (state: State) {
  const filename = getApiUpdateFilename(state)

  return getApiUpdateContents()
    .then(contents => {
      const formData = new FormData()
      formData.append('whl', contents, filename)
      return formData
    })
    .catch(error => Promise.reject(FetchError(error)))
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
    payload: {robot, path, response},
  }
}

function serverFailure (
  robot: RobotService,
  path: RequestPath,
  error: ApiRequestError
): ServerFailureAction {
  return {type: 'api:SERVER_FAILURE', payload: {robot, path, error}}
}

function clearServerResponse (
  robot: RobotService,
  path: RequestPath
): ClearServerAction {
  return {type: 'api:CLEAR_SERVER_RESPONSE', payload: {robot, path}}
}
