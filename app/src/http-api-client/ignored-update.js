// @flow
// ignored update http api module
import {createSelector} from 'reselect'

import type {State, ThunkPromiseAction, Action} from '../types'
import type {RobotService} from '../robot'

import type {ApiCall} from './types'
import client, {type ApiRequestError} from './client'

type VersionResponse = ?{
  version: ?string,
}

export type IgnoredUpdateRequestAction = {|
  type: 'api:IGNORED_UPDATE_REQUEST',
  payload: {
    robot: RobotService,
    version?: VersionResponse
  }
|}

export type IgnoredUpdateSuccessAction = {|
  type: 'api:IGNORED_UPDATE_SUCCESS',
  payload: {|
    robot: RobotService,
    version: VersionResponse,
  |}
|}

export type IgnoredUpdateFailureAction = {|
  type: 'api:IGNORED_UPDATE_FAILURE',
  payload: {|
    robot: RobotService,
    error: ApiRequestError,
  |}
|}

export type IgnoredUpdateAction =
  | IgnoredUpdateRequestAction
  | IgnoredUpdateSuccessAction
  | IgnoredUpdateFailureAction

export type IgnoredUpdate = ApiCall<void, VersionResponse>

type IgnoredUpdateState = {
  [robotName: string]: ?IgnoredUpdate
}

export function fetchIgnoredUpdate (robot: RobotService): ThunkPromiseAction {
  return (dispatch) => {
    dispatch(ignoredUpdateRequest(robot))

    return client(robot, 'GET', 'server/update/ignore')
      .then((version) => dispatch(ignoredUpdateSuccess(robot, version)))
      .catch((error) => dispatch(ignoredUpdateFailure(robot, error)))
  }
}

export function setUpdateIgnored (robot: RobotService, version: ?string): ThunkPromiseAction {
  return (dispatch) => {
    const body = {version}
    dispatch(ignoredUpdateRequest(robot, body))

    return client(robot, 'POST', 'server/update/ignore', body)
      .then((version) => dispatch(ignoredUpdateSuccess(robot, version)))
      .catch((error) => dispatch(ignoredUpdateFailure(robot, error)))
  }
}

export function ignoredUpdateReducer (
  state: ?IgnoredUpdateState,
  action: Action
): IgnoredUpdateState {
  if (state == null) return {}
  switch (action.type) {
    case 'api:IGNORED_UPDATE_REQUEST':
      return {
        ...state,
        [action.payload.robot.name]: {
          ...state[action.payload.robot.name],
          inProgress: true,
          error: null
        }
      }

    case 'api:IGNORED_UPDATE_SUCCESS':
      return {
        ...state,
        [action.payload.robot.name]: {
          ...state[action.payload.robot.name],
          inProgress: false,
          response: action.payload.version
        }
      }

    case 'api:IGNORED_UPDATE_FAILURE':
      return {
        ...state,
        [action.payload.robot.name]: {
          ...state[action.payload.robot.name],
          inProgress: false,
          error: action.payload.error
        }
      }
  }
  return state
}

function ignoredUpdateRequest (robot: RobotService, version: ?VersionResponse): IgnoredUpdateRequestAction {
  return {type: 'api:IGNORED_UPDATE_REQUEST', payload: {robot, version}}
}

function ignoredUpdateSuccess (
  robot: RobotService,
  version: VersionResponse
): IgnoredUpdateSuccessAction {
  return {type: 'api:IGNORED_UPDATE_SUCCESS', payload: {robot, version}}
}

function ignoredUpdateFailure (
  robot: RobotService,
  error: ApiRequestError
): IgnoredUpdateFailureAction {
  return {type: 'api:IGNORED_UPDATE_FAILURE', payload: {robot, error}}
}

// rework me for ignored
function selectIgnoredState (state: State) {
  return state.api.ignoredUpdate
}

function selectRobotIgnoredState (state: State, props: RobotService) {
  return selectIgnoredState(state)[props.name]
}

export const makeGetIgnoredUpdate = () => createSelector(
  selectRobotIgnoredState,
  (state: ?IgnoredUpdate): IgnoredUpdate => {
    return state || {inProgress: false, error: null, response: null}
  }
)
