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

const SETTINGS: 'settings' = 'settings'

// TODO(mc, 2018-07-03): flow helper until we have one reducer, since
// p === 'constant' checks but p === CONSTANT does not, even if
// CONSTANT is defined as `const CONSTANT: 'constant' = 'constant'`
function getSettingsPath (p: string): ?SettingsPath {
  if (p === 'settings') return p

  return null
}

export function fetchSettings (robot: RobotService): ThunkPromiseAction {
  const request: SettingsRequest = null

  return (dispatch) => {
    dispatch(apiRequest(robot, SETTINGS, request))

    return client(robot, 'GET', SETTINGS)
      .then(
        (res: SettingsResponse) => apiSuccess(robot, SETTINGS, res),
        (err: ApiRequestError) => apiFailure(robot, SETTINGS, err)
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
    dispatch(apiRequest(robot, SETTINGS, request))

    return client(robot, 'POST', SETTINGS, request)
      .then(
        (res: SettingsResponse) => apiSuccess(robot, SETTINGS, res),
        (err: ApiRequestError) => apiFailure(robot, SETTINGS, err)
      )
      .then(dispatch)
  }
}

// TODO(mc, 2018-07-03): remove in favor of single HTTP API reducer
export function settingsReducer (
  state: SettingsState = {},
  action: Action
): SettingsState {
  switch (action.type) {
    case 'api:REQUEST': {
      const path = getSettingsPath(action.payload.path)
      if (!path) return state
      const {payload: {request, robot: {name}}} = action
      const stateByName = state[name] || {}
      const stateByPath = stateByName[path] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, request, inProgress: true, error: null}
        }
      }
    }

    case 'api:SUCCESS': {
      const path = getSettingsPath(action.payload.path)
      if (!path) return state
      const {payload: {response, robot: {name}}} = action
      const stateByName = state[name] || {}
      const stateByPath = stateByName[path] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, response, inProgress: false, error: null}
        }
      }
    }

    case 'api:FAILURE': {
      const path = getSettingsPath(action.payload.path)
      if (!path) return state
      const {payload: {error, robot: {name}}} = action
      const stateByName = state[name] || {}
      const stateByPath = stateByName[path] || {}

      return {
        ...state,
        [name]: {
          ...stateByName,
          [path]: {...stateByPath, error, inProgress: false}
        }
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
  let requestState = state[SETTINGS] || {inProgress: false}

  // guard against an older version of GET /settings
  if (requestState.response && !('settings' in requestState.response)) {
    requestState = {...requestState, response: {settings: []}}
  }

  return requestState
}
