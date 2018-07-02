// @flow
// robot settings endpoints
import {createSelector, type Selector} from 'reselect'

import type {State, Action, ThunkPromiseAction} from '../types'
import type {BaseRobot, RobotService} from '../robot'
import type {ApiCall, ApiRequestError} from './types'
import client from './client'

import {apiRequest, apiSuccess, apiFailure} from './actions'
import type {ApiRequestAction, ApiSuccessAction, ApiFailureAction} from './actions'

type Id = string

// TODO(mc, 2018-07-02): support more value types
type Value = boolean

export type Setting = {
  id: Id,
  title: string,
  description: string,
  value: Value,
}

type SettingsPath = 'settings'

type SettingsRequest = ?{id: Id, value: Value}

type SettingsResponse = {settings: Array<Setting>}

export type SettingsAction =
  | ApiRequestAction<SettingsPath, SettingsRequest>
  | ApiSuccessAction<SettingsPath, SettingsResponse>
  | ApiFailureAction<SettingsPath>

type RobotSettingsRequestState = ApiCall<SettingsRequest, SettingsResponse>

type RobotSettingsState = {
  settings?: RobotSettingsRequestState
}

export type SettingsState = {
  [robotName: string]: ?RobotSettingsState,
}

const SETTINGS_PATH: SettingsPath = 'settings'

export function fetchSettings (robot: RobotService): ThunkPromiseAction {
  const request: SettingsRequest = null

  return (dispatch) => {
    dispatch(apiRequest(robot, SETTINGS_PATH, request))

    return client(robot, 'GET', SETTINGS_PATH)
      .then(
        (res: SettingsResponse) => apiSuccess(robot, SETTINGS_PATH, res),
        (err: ApiRequestError) => apiFailure(robot, SETTINGS_PATH, err)
      )
      .then(dispatch)
  }
}

export function setSettings (
  robot: RobotService,
  id: Id,
  value: Value
): ThunkPromiseAction {
  const request: SettingsRequest = {id, value}

  return (dispatch) => {
    dispatch(apiRequest(robot, SETTINGS_PATH, request))

    return client(robot, 'POST', SETTINGS_PATH, request)
      .then(
        (res: SettingsResponse) => apiSuccess(robot, SETTINGS_PATH, res),
        (err: ApiRequestError) => apiFailure(robot, SETTINGS_PATH, err)
      )
      .then(dispatch)
  }
}

export function settingsReducer (
  state: SettingsState = {},
  action: Action
): SettingsState {
  let name
  let path
  let request
  let response
  let error
  let stateByName
  let stateByPath

  switch (action.type) {
    case 'api:REQUEST':
      path = action.payload.path
      if (path !== SETTINGS_PATH) return state
      name = action.payload.robot.name
      request = action.payload.request
      stateByName = state[name] || {}
      stateByPath = stateByName[path] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, request, inProgress: true, error: null}
        }
      }

    case 'api:SUCCESS':
      path = action.payload.path
      if (path !== SETTINGS_PATH) return state
      name = action.payload.robot.name
      response = action.payload.response
      stateByName = state[name] || {}
      stateByPath = stateByName[path] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, response, inProgress: false, error: null}
        }
      }

    case 'api:FAILURE':
      path = action.payload.path
      if (path !== SETTINGS_PATH) return state
      name = action.payload.robot.name
      error = action.payload.error
      stateByName = state[name] || {}
      stateByPath = stateByName[path] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, error, inProgress: false}
        }
      }
  }

  return state
}

export function makeGetRobotSettings () {
  const selector: Selector<State, BaseRobot, RobotSettingsRequestState> =
    createSelector(getRobotSettingsState, getSettingsRequest)

  return selector
}

function getRobotSettingsState (
  state: State,
  props: BaseRobot
): RobotSettingsState {
  return state.api.settings[props.name] || {}
}

function getSettingsRequest (
  state: RobotSettingsState
): RobotSettingsRequestState {
  let requestState = state[SETTINGS_PATH] || {inProgress: false}

  // guard against an older version of GET /settings
  if (requestState.response && !('settings' in requestState.response)) {
    requestState = {...requestState, response: {settings: []}}
  }

  return requestState
}
