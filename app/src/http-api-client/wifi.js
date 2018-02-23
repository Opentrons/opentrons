// @flow
// wifi http api module
import {createSelector} from 'reselect'

import type {State, ThunkAction, Action} from '../types'
import type {RobotService} from '../robot'

import type {ApiCall} from './types'
import client, {type ClientResponseError} from './client'

type Ssid = string

type Psk = string

type Message = string

type Status = 'none' | 'portal' | 'limited' | 'full' | 'unknown' | 'testing'

type NetworkList = Array<{
  ssid: Ssid,
  signal: ?number,
  active: boolean
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
    response: WifiResponse,
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

export type SetConfigureWifiBodyAction = {|
  type: 'api:SET_CONFIGURE_WIFI_BODY',
  payload: {|
    robot: RobotService,
    update: {
      ssid?: Ssid,
      psk?: Psk
    }
  |}
|}

export type ClearConfigureWifiResponseAction = {|
  type: 'api:CLEAR_CONFIGURE_WIFI_RESPONSE',
  payload: {|
    robot: RobotService
  |}
|}

export type WifiAction =
  | WifiRequestAction
  | WifiSuccessAction
  | WifiFailureAction
  | SetConfigureWifiBodyAction
  | ClearConfigureWifiResponseAction

export type RobotWifiList = ApiCall<void, WifiListResponse>
export type RobotWifiStatus = ApiCall<void, WifiStatusResponse>
export type RobotWifiConfigure = ApiCall<
  ConfigureRequest,
  WifiConfigureResponse
>

type RobotWifiState = {
  list?: RobotWifiList,
  status?: RobotWifiStatus,
  configure?: RobotWifiConfigure,
}

type WifiState = {
  [robotName: string]: ?RobotWifiState
}

const LIST_PATH: RequestPath = 'list'
const STATUS_PATH: RequestPath = 'status'
const CONFIGURE_PATH: RequestPath = 'configure'

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

export function setConfigureWifiBody (
  robot: RobotService,
  update: {ssid?: Ssid, psk?: Psk}
): SetConfigureWifiBodyAction {
  return {type: 'api:SET_CONFIGURE_WIFI_BODY', payload: {robot, update}}
}

export function clearConfigureWifiResponse (
  robot: RobotService
): ClearConfigureWifiResponseAction {
  return {type: 'api:CLEAR_CONFIGURE_WIFI_RESPONSE', payload: {robot}}
}

export function configureWifi (robot: RobotService): ThunkAction {
  return (dispatch, getState) => {
    const robotWifiState = selectRobotWifiState(getState(), robot) || {}
    const configureState = robotWifiState.configure || {}
    const body = configureState.request

    if (!body) {
      return console.warn('configureWifi called without setConfigureWifiBody')
    }

    dispatch(wifiRequest(robot, CONFIGURE_PATH))

    return client(robot, 'POST', `wifi/${CONFIGURE_PATH}`, body)
      .then((resp) => dispatch(wifiSuccess(robot, CONFIGURE_PATH, resp)))
      .catch((error) => dispatch(wifiFailure(robot, CONFIGURE_PATH, error)))
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

    case 'api:SET_CONFIGURE_WIFI_BODY':
    case 'api:CLEAR_CONFIGURE_WIFI_RESPONSE':
      return reduceConfigureWifiAction(state, action)
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
        list: dedupeNetworkList(listState.response.list)
      }
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
    payload: {robot, path, response}
  }
}

function wifiFailure (
  robot: RobotService,
  path: RequestPath,
  error: ClientResponseError
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
      [path]: {...stateByNameByPath, error: null, inProgress: true}
    }
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
      [path]: {response, request, error: null, inProgress: false}
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
      [path]: {...stateByNameByPath, error, inProgress: false}
    }
  }
}

function reduceConfigureWifiAction (
  state: WifiState,
  action: SetConfigureWifiBodyAction | ClearConfigureWifiResponseAction
): WifiState {
  const {payload: {robot: {name}}} = action
  const stateByName = state[name] || {}
  const configureState = stateByName.configure || {}
  let {request, response, error} = configureState

  if (action.type === 'api:SET_CONFIGURE_WIFI_BODY') {
    request = {...request, ...action.payload.update}
  } else {
    response = null
    error = null
  }

  return {
    ...state,
    [name]: {
      ...stateByName,
      configure: {...configureState, request, response, error}
    }
  }
}
