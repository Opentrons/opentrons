import type {
  RobotApiRequestMeta,
  RobotApiErrorResponse,
} from '../robot-api/types'

import {
  FETCH_STATUS,
  FETCH_STATUS_SUCCESS,
  FETCH_STATUS_FAILURE,
  POST_WIFI_CONFIGURE,
  POST_WIFI_CONFIGURE_SUCCESS,
  POST_WIFI_CONFIGURE_FAILURE,
  FETCH_WIFI_KEYS,
  FETCH_WIFI_KEYS_SUCCESS,
  FETCH_WIFI_KEYS_FAILURE,
  POST_WIFI_KEYS,
  POST_WIFI_KEYS_SUCCESS,
  POST_WIFI_KEYS_FAILURE,
  FETCH_EAP_OPTIONS,
  FETCH_EAP_OPTIONS_SUCCESS,
  FETCH_EAP_OPTIONS_FAILURE,
} from './constants'

import * as ApiTypes from './api-types'

export * from './api-types'

// fetch status

export interface FetchStatusAction {
  type: typeof FETCH_STATUS
  payload: { robotName: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchStatusSuccessAction {
  type: typeof FETCH_STATUS_SUCCESS
  payload: {
    robotName: string
    internetStatus: ApiTypes.InternetStatus
    interfaces: ApiTypes.InterfaceStatusMap
  }
  meta: RobotApiRequestMeta
}

export interface FetchStatusFailureAction {
  type: typeof FETCH_STATUS_FAILURE
  payload: { robotName: string; error: {} }
  meta: RobotApiRequestMeta
}

// connect to new network

export interface PostWifiConfigureAction {
  type: typeof POST_WIFI_CONFIGURE
  payload: { robotName: string; options: ApiTypes.WifiConfigureRequest }
  meta: RobotApiRequestMeta | {}
}

export interface PostWifiConfigureSuccessAction {
  type: typeof POST_WIFI_CONFIGURE_SUCCESS
  payload: { robotName: string; ssid: string }
  meta: RobotApiRequestMeta
}

export interface PostWifiConfigureFailureAction {
  type: typeof POST_WIFI_CONFIGURE_FAILURE
  payload: { robotName: string; error: RobotApiErrorResponse }
  meta: RobotApiRequestMeta
}

// fetch wifi keys

export interface FetchWifiKeysAction {
  type: typeof FETCH_WIFI_KEYS
  payload: { robotName: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchWifiKeysSuccessAction {
  type: typeof FETCH_WIFI_KEYS_SUCCESS
  payload: { robotName: string; wifiKeys: ApiTypes.ApiWifiKey[] }
  meta: RobotApiRequestMeta
}

export interface FetchWifiKeysFailureAction {
  type: typeof FETCH_WIFI_KEYS_FAILURE
  payload: { robotName: string; error: RobotApiErrorResponse }
  meta: RobotApiRequestMeta
}

// post wifi keys

export interface PostWifiKeysAction {
  type: typeof POST_WIFI_KEYS
  payload: { robotName: string; keyFile: File }
  meta: RobotApiRequestMeta | {}
}

export interface PostWifiKeysSuccessAction {
  type: typeof POST_WIFI_KEYS_SUCCESS
  payload: { robotName: string; wifiKey: ApiTypes.ApiWifiKey }
  meta: RobotApiRequestMeta
}

export interface PostWifiKeysFailureAction {
  type: typeof POST_WIFI_KEYS_FAILURE
  payload: { robotName: string; error: RobotApiErrorResponse }
  meta: RobotApiRequestMeta
}

// fetch eap options

export interface FetchEapOptionsAction {
  type: typeof FETCH_EAP_OPTIONS
  payload: { robotName: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchEapOptionsSuccessAction {
  type: typeof FETCH_EAP_OPTIONS_SUCCESS
  payload: { robotName: string; eapOptions: ApiTypes.EapOption[] }
  meta: RobotApiRequestMeta
}

export interface FetchEapOptionsFailureAction {
  type: typeof FETCH_EAP_OPTIONS_FAILURE
  payload: { robotName: string; error: RobotApiErrorResponse }
  meta: RobotApiRequestMeta
}

// disconnect network

export interface PostWifiDisconnectAction {
  type: 'networking:POST_WIFI_DISCONNECT'
  payload: { robotName: string; ssid: string }
  meta: RobotApiRequestMeta | {}
}

export interface PostWifiDisconnectSuccessAction {
  type: 'networking:POST_WIFI_DISCONNECT_SUCCESS'
  payload: { robotName: string }
  meta: RobotApiRequestMeta
}

export interface PostWifiDisconnectFailureAction {
  type: 'networking:POST_WIFI_DISCONNECT_FAILURE'
  payload: { robotName: string; error: {} }
  meta: RobotApiRequestMeta
}

export interface ClearWifiStatusAction {
  type: 'networking:CLEAR_WIFI_STATUS'
  payload: { robotName: string }
}

export interface NetworkingDisconnectResponse {
  ssid: string
}

// action union

export type NetworkingAction =
  | FetchStatusAction
  | FetchStatusSuccessAction
  | FetchStatusFailureAction
  | PostWifiConfigureAction
  | PostWifiConfigureSuccessAction
  | PostWifiConfigureFailureAction
  | FetchWifiKeysAction
  | FetchWifiKeysSuccessAction
  | FetchWifiKeysFailureAction
  | PostWifiKeysAction
  | PostWifiKeysSuccessAction
  | PostWifiKeysFailureAction
  | FetchEapOptionsAction
  | FetchEapOptionsSuccessAction
  | FetchEapOptionsFailureAction
  | PostWifiDisconnectAction
  | PostWifiDisconnectSuccessAction
  | PostWifiDisconnectFailureAction
  | ClearWifiStatusAction

// state types

export interface WifiKey extends ApiTypes.ApiWifiKey {
  // if the api key was added by a specific request, add the ID in networking
  // state so the UI can track which key it added
  requestId?: string
}

export type PerRobotNetworkingState = Partial<{
  internetStatus?: ApiTypes.InternetStatus
  interfaces?: ApiTypes.InterfaceStatusMap
  wifiList?: ApiTypes.WifiNetwork[]
  wifiKeyIds?: string[]
  wifiKeysById?: Partial<{ [id: string]: WifiKey }>
  eapOptions?: ApiTypes.EapOption[]
}>

export type NetworkingState = Partial<{
  [robotName: string]: null | undefined | PerRobotNetworkingState
}>

// selector types

export interface SimpleInterfaceStatus {
  ipAddress: string | null
  subnetMask: string | null
  macAddress: string
  type: ApiTypes.InterfaceType
}

export interface InterfaceStatusByType {
  wifi: SimpleInterfaceStatus | null
  ethernet: SimpleInterfaceStatus | null
}
