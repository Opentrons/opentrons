// @flow
// wifi http api module
import {createSelector} from 'reselect'

import type {State, ThunkPromiseAction, Action} from '../types'
import type {RobotService} from '../robot'

import type {ApiCall} from './types'
import client, {type ApiRequestError} from './client'

type Ssid = string

type Psk = string

type Message = string

type Status = 'none' | 'portal' | 'limited' | 'full' | 'unknown' | 'testing'

type NetworkList = Array<{
  ssid: Ssid,
  signal: ?number,
  active: boolean,
}>

export type WifiListResponse = {
  list: NetworkList,
}

export type WifiStatusResponse = {
  status: Status,
}

type ConfigureRequest = {
  ssid: Ssid,
  psk: Psk,
}

export type WifiConfigureResponse = {
  ssid: Ssid,
  message: Message,
}

type WifiResponse =
  | WifiListResponse
  | WifiStatusResponse
  | WifiConfigureResponse

type RequestPath = 'list' | 'status' | 'configure'

export type WifiRequestAction = {|
  type: 'api:WIFI_REQUEST',
  payload: {|
    robot: RobotService,
    path: RequestPath,
  |},
|}

export type WifiSuccessAction = {|
  type: 'api:WIFI_SUCCESS',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    response: WifiResponse,
  |},
|}

export type WifiFailureAction = {|
  type: 'api:WIFI_FAILURE',
  payload: {|
    robot: RobotService,
    path: RequestPath,
    error: ApiRequestError,
  |},
|}

export type ClearConfigureWifiResponseAction = {|
  type: 'api:CLEAR_CONFIGURE_WIFI_RESPONSE',
  payload: {|
    robot: RobotService,
  |},
|}

export type WifiAction =
  | WifiRequestAction
  | WifiSuccessAction
  | WifiFailureAction
  | ClearConfigureWifiResponseAction

export type RobotWifiList = ApiCall<void, WifiListResponse>
export type RobotWifiStatus = ApiCall<void, WifiStatusResponse>
export type RobotWifiConfigure =
  ApiCall<ConfigureRequest, WifiConfigureResponse>

type RobotWifiState = {
  list?: RobotWifiList,
  status?: RobotWifiStatus,
  configure?: RobotWifiConfigure,
}

type WifiState = {
  [robotName: string]: ?RobotWifiState,
}

const LIST: RequestPath = 'list'
const STATUS: RequestPath = 'status'
const CONFIGURE: RequestPath = 'configure'

export function fetchWifiList (robot: RobotService): ThunkPromiseAction {
  return (dispatch) => {
    dispatch(wifiRequest(robot, LIST))

    return client(robot, 'GET', `wifi/${LIST}`).then(
      (resp: WifiListResponse) => dispatch(wifiSuccess(robot, LIST, resp)),
      (err: ApiRequestError) => dispatch(wifiFailure(robot, LIST, err))
    )
  }
}

export function fetchWifiStatus (robot: RobotService): ThunkPromiseAction {
  return (dispatch) => {
    dispatch(wifiRequest(robot, STATUS))

    return client(robot, 'GET', `wifi/${STATUS}`).then(
      (resp: WifiStatusResponse) => dispatch(wifiSuccess(robot, STATUS, resp)),
      (err: ApiRequestError) => dispatch(wifiFailure(robot, STATUS, err))
    )
  }
}

export function clearConfigureWifiResponse (
  robot: RobotService
): ClearConfigureWifiResponseAction {
  return {type: 'api:CLEAR_CONFIGURE_WIFI_RESPONSE', payload: {robot}}
}

export function configureWifi (robot: RobotService, ssid: ?string, psk: ?string): ThunkPromiseAction {
  const body = {ssid, psk}

  return (dispatch) => {
    dispatch(wifiRequest(robot, CONFIGURE))

    return client(robot, 'POST', `wifi/${CONFIGURE}`, body).then(
      (r: WifiConfigureResponse) => dispatch(wifiSuccess(robot, CONFIGURE, r)),
      (err: ApiRequestError) => dispatch(wifiFailure(robot, CONFIGURE, err))
    )
  }
}

export function wifiReducer (state: ?WifiState, action: Action): WifiState {
  if (state == null) return {}

  switch (action.type) {
    case 'api:WIFI_REQUEST':
      return reduceWifiRequest(state, action)

    case 'api:WIFI_SUCCESS':
      return reduceWifiSuccess(state, action)

    case 'api:WIFI_FAILURE':
      return reduceWifiFailure(state, action)

    case 'api:CLEAR_CONFIGURE_WIFI_RESPONSE':
      return reduceClearConfigureWifiAction(state, action)
  }

  return state
}

export const makeGetRobotWifiStatus = () => createSelector(
  selectRobotWifiState,
  (state: ?RobotWifiState): RobotWifiStatus => (
    (state && state.status) ||
    {inProgress: false, error: null, response: null}
  )
)

export const makeGetRobotWifiList = () => createSelector(
  selectRobotWifiState,
  (state: ?RobotWifiState): RobotWifiList => {
    const listState = (
      (state && state.list) ||
      {inProgress: false, error: null, response: null}
    )

    if (!listState.response) return listState

    return {
      ...listState,
      response: {
        ...listState.response,
        list: dedupeNetworkList(listState.response.list),
      },
    }
  }
)

export const makeGetRobotWifiConfigure = () => createSelector(
  selectRobotWifiState,
  (state: ?RobotWifiState): RobotWifiConfigure => (
    (state && state.configure) ||
    {inProgress: false, error: null, request: null, response: null}
  )
)

function selectRobotWifiState (state: State, props: RobotService) {
  return state.api.wifi[props.name]
}

function dedupeNetworkList (list: NetworkList): NetworkList {
  const {ids, networksById} = list.reduce((result, network) => {
    const {ssid, active} = network

    if (!result.networksById[ssid]) {
      result.ids.push(ssid)
      result.networksById[ssid] = network
    } else if (active) {
      result.networksById[ssid].active = true
    }

    return result
  }, {ids: [], networksById: {}})

  return ids.map((ssid) => networksById[ssid])
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
  response: WifiResponse
): WifiSuccessAction {
  return {
    type: 'api:WIFI_SUCCESS',
    payload: {robot, path, response},
  }
}

function wifiFailure (
  robot: RobotService,
  path: RequestPath,
  error: ApiRequestError
): WifiFailureAction {
  return {type: 'api:WIFI_FAILURE', payload: {robot, path, error}}
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
      [path]: {...stateByNameByPath, error: null, inProgress: true},
    },
  }
}

function reduceWifiSuccess (
  state: WifiState,
  action: WifiSuccessAction
): WifiState {
  const {payload: {path, response, robot: {name}}} = action
  const stateByName = state[name] || {}
  const stateByNameByPath = stateByName[path] || {}
  let request = stateByNameByPath.request || null

  // clear out the PSK on a successful wifi request
  if (path === 'configure' && request) {
    request = {ssid: request.ssid, psk: ''}
  }

  return {
    ...state,
    [name]: {
      ...stateByName,
      [path]: {response, request, error: null, inProgress: false},
    },
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
      [path]: {...stateByNameByPath, error, inProgress: false},
    },
  }
}

function reduceClearConfigureWifiAction (
  state: WifiState,
  action: ClearConfigureWifiResponseAction
): WifiState {
  const {payload: {robot: {name}}} = action
  const stateByName = state[name] || {}
  const configureState = stateByName.configure || {}

  return {
    ...state,
    [name]: {
      ...stateByName,
      configure: {...configureState, response: null, error: null},
    },
  }
}
