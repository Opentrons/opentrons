// @flow
// wifi http api module
import type {State, ThunkAction, Action} from '../types'
import type {RobotService} from '../robot'

import type {ApiResponse} from './types'
import client, {type ClientResponseError} from './client'

type SsidList = string[]

type Status = 'none' | 'portal' | 'limited' | 'full' | 'unknown' | 'testing'

type ListResponse = SsidList

type StatusResponse = {
  status: Status,
}

type ConfigureResponse = {}

type RequestPath = 'list' | 'status'

export type WifiRequestAction = {|
  type: 'api:WIFI_REQUEST',
  payload: {
    robot: RobotService,
    path: RequestPath,
  }
|}

export type WifiSuccessAction = {|
  type: 'api:WIFI_SUCCESS',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    list?: SsidList,
    status?: Status,
  |}
|}

export type WifiFailureAction = {|
  type: 'api:WIFI_FAILURE',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    error: ClientResponseError,
  |}
|}

export type WifiAction =
  | WifiRequestAction
  | WifiSuccessAction
  | WifiFailureAction

export type RobotWifi = {
  list: ApiResponse<ListResponse>,
  configure: ApiResponse<ConfigureResponse>,
  status: ApiResponse<StatusResponse>,
}

export type WifiState = {
  [robotName: string]: RobotWifi
}

const LIST_PATH: RequestPath = 'list'
const STATUS_PATH: RequestPath = 'status'

export function fetchWifiList (robot: RobotService): ThunkAction {
  return (dispatch) => {
    dispatch(wifiRequest(robot, LIST_PATH))

    return client(robot, 'GET', `wifi/${LIST_PATH}`)
      .then((response) => dispatch(wifiSuccess(robot, LIST_PATH, response)))
      .catch((error) => dispatch(wifiFailure(robot, LIST_PATH, error)))
  }
}

export function fetchWifiStatus (robot: RobotService): ThunkAction {
  return (dispatch) => {
    dispatch(wifiRequest(robot, STATUS_PATH))

    return client(robot, 'GET', `wifi/${STATUS_PATH}`)
      .then((response) => dispatch(wifiSuccess(robot, STATUS_PATH, response)))
      .catch((error) => dispatch(wifiFailure(robot, STATUS_PATH, error)))
  }
}

export function wifiReducer (state: ?WifiState, action: Action): WifiState {
  if (state == null) return {}

  switch (action.type) {
    case 'api:WIFI_REQUEST': return reduceWifiRequest(state, action)
    case 'api:WIFI_SUCCESS': return reduceWifiSuccess(state, action)
    case 'api:WIFI_FAILURE': return reduceWifiFailure(state, action)
  }

  return state
}

export function selectWifi (state: State): WifiState {
  return state.api.wifi
}

function wifiRequest (
  robot: RobotService,
  path: RequestPath
): WifiRequestAction {
  return {type: 'api:WIFI_REQUEST', payload: {robot, path}}
}

function wifiSuccess (
  robot: RobotService,
  path: RequestPath,
  response: {}
): WifiSuccessAction {
  const action: WifiSuccessAction = {
    type: 'api:WIFI_SUCCESS',
    payload: {robot, path}
  }

  if (path === LIST_PATH) {
    action.payload.list = listFromResponse(response)
  } else if (path === STATUS_PATH) {
    action.payload.status = statusFromResponse(response)
  }

  return action
}

function wifiFailure (
  robot: RobotService,
  path: RequestPath,
  error: ClientResponseError
): WifiFailureAction {
  return {type: 'api:WIFI_FAILURE', payload: {robot, path, error}}
}

function listFromResponse (response: {}): SsidList {
  return Array.isArray(response)
    ? response.map((ssid) => `${ssid}`)
    : []
}

function isStatus (maybeStatus: mixed): boolean %checks {
  return (
    maybeStatus === 'none' ||
    maybeStatus === 'portal' ||
    maybeStatus === 'limited' ||
    maybeStatus === 'full' ||
    maybeStatus === 'unknown' ||
    maybeStatus === 'testing'
  )
}

function statusFromResponse (response: {}): Status {
  if (response && response.status && isStatus(response.status)) {
    return response.status
  }

  return 'unknown'
}

function reduceWifiRequest (
  state: WifiState,
  action: WifiRequestAction
): WifiState {
  const {payload: {path, robot: {name}}} = action
  const stateByName = state[name] || {}
  const stateByNameByPath = stateByName[path] || {}

  return {
    ...state,
    [name]: {
      ...stateByName,
      [path]: {
        ...stateByNameByPath,
        inProgress: true,
        error: null
      }
    }
  }
}

function reduceWifiSuccess (
  state: WifiState,
  action: WifiSuccessAction
): WifiState {
  const {payload: {path, robot: {name}}} = action
  const stateByName = state[name] || {}

  return {
    ...state,
    [name]: {
      ...stateByName,
      [path]: {
        inProgress: false,
        error: null,
        response: action.payload[path]
      }
    }
  }
}

function reduceWifiFailure (
  state: WifiState,
  action: WifiFailureAction
): WifiState {
  const {payload: {path, error, robot: {name}}} = action
  const stateByName = state[name] || {}
  const stateByNameByPath = stateByName[path] || {}

  return {
    ...state,
    [name]: {
      ...stateByName,
      [path]: {
        ...stateByNameByPath,
        inProgress: false,
        error
      }
    }
  }
}
