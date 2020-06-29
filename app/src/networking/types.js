// @flow

import type {
  RobotApiErrorResponse,
  RobotApiRequestMeta,
} from '../robot-api/types'
import * as ApiTypes from './api-types'
import typeof {
  FETCH_EAP_OPTIONS,
  FETCH_EAP_OPTIONS_FAILURE,
  FETCH_EAP_OPTIONS_SUCCESS,
  FETCH_STATUS,
  FETCH_STATUS_FAILURE,
  FETCH_STATUS_SUCCESS,
  FETCH_WIFI_KEYS,
  FETCH_WIFI_KEYS_FAILURE,
  FETCH_WIFI_KEYS_SUCCESS,
  FETCH_WIFI_LIST,
  FETCH_WIFI_LIST_FAILURE,
  FETCH_WIFI_LIST_SUCCESS,
  POST_WIFI_CONFIGURE,
  POST_WIFI_CONFIGURE_FAILURE,
  POST_WIFI_CONFIGURE_SUCCESS,
  POST_WIFI_KEYS,
  POST_WIFI_KEYS_FAILURE,
  POST_WIFI_KEYS_SUCCESS,
} from './constants'

export * from './api-types'

// fetch status

export type FetchStatusAction = {|
  type: FETCH_STATUS,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchStatusSuccessAction = {|
  type: FETCH_STATUS_SUCCESS,
  payload: {|
    robotName: string,
    internetStatus: ApiTypes.InternetStatus,
    interfaces: ApiTypes.InterfaceStatusMap,
  |},
  meta: RobotApiRequestMeta,
|}

export type FetchStatusFailureAction = {|
  type: FETCH_STATUS_FAILURE,
  payload: {| robotName: string, error: { ... } |},
  meta: RobotApiRequestMeta,
|}

// fetch wifi list

export type FetchWifiListAction = {|
  type: FETCH_WIFI_LIST,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchWifiListSuccessAction = {|
  type: FETCH_WIFI_LIST_SUCCESS,
  payload: {| robotName: string, wifiList: Array<ApiTypes.WifiNetwork> |},
  meta: RobotApiRequestMeta,
|}

export type FetchWifiListFailureAction = {|
  type: FETCH_WIFI_LIST_FAILURE,
  payload: {| robotName: string, error: RobotApiErrorResponse |},
  meta: RobotApiRequestMeta,
|}

// connect to new network

export type PostWifiConfigureAction = {|
  type: POST_WIFI_CONFIGURE,
  payload: {| robotName: string, options: ApiTypes.WifiConfigureRequest |},
  meta: RobotApiRequestMeta,
|}

export type PostWifiConfigureSuccessAction = {|
  type: POST_WIFI_CONFIGURE_SUCCESS,
  payload: {| robotName: string, ssid: string |},
  meta: RobotApiRequestMeta,
|}

export type PostWifiConfigureFailureAction = {|
  type: POST_WIFI_CONFIGURE_FAILURE,
  payload: {| robotName: string, error: RobotApiErrorResponse |},
  meta: RobotApiRequestMeta,
|}

// fetch wifi keys

export type FetchWifiKeysAction = {|
  type: FETCH_WIFI_KEYS,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchWifiKeysSuccessAction = {|
  type: FETCH_WIFI_KEYS_SUCCESS,
  payload: {| robotName: string, wifiKeys: Array<ApiTypes.ApiWifiKey> |},
  meta: RobotApiRequestMeta,
|}

export type FetchWifiKeysFailureAction = {|
  type: FETCH_WIFI_KEYS_FAILURE,
  payload: {| robotName: string, error: RobotApiErrorResponse |},
  meta: RobotApiRequestMeta,
|}

// post wifi keys

export type PostWifiKeysAction = {|
  type: POST_WIFI_KEYS,
  payload: {| robotName: string, keyFile: File |},
  meta: RobotApiRequestMeta,
|}

export type PostWifiKeysSuccessAction = {|
  type: POST_WIFI_KEYS_SUCCESS,
  payload: {| robotName: string, wifiKey: ApiTypes.ApiWifiKey |},
  meta: RobotApiRequestMeta,
|}

export type PostWifiKeysFailureAction = {|
  type: POST_WIFI_KEYS_FAILURE,
  payload: {| robotName: string, error: RobotApiErrorResponse |},
  meta: RobotApiRequestMeta,
|}

// fetch eap options

export type FetchEapOptionsAction = {|
  type: FETCH_EAP_OPTIONS,
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchEapOptionsSuccessAction = {|
  type: FETCH_EAP_OPTIONS_SUCCESS,
  payload: {| robotName: string, eapOptions: Array<ApiTypes.EapOption> |},
  meta: RobotApiRequestMeta,
|}

export type FetchEapOptionsFailureAction = {|
  type: FETCH_EAP_OPTIONS_FAILURE,
  payload: {| robotName: string, error: RobotApiErrorResponse |},
  meta: RobotApiRequestMeta,
|}

// disconnect network

export type PostWifiDisconnectAction = {|
  type: 'networking:POST_WIFI_DISCONNECT',
  payload: {| robotName: string, ssid: string |},
  meta: RobotApiRequestMeta,
|}

export type PostWifiDisconnectSuccessAction = {|
  type: 'networking:POST_WIFI_DISCONNECT_SUCCESS',
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type PostWifiDisconnectFailureAction = {|
  type: 'networking:POST_WIFI_DISCONNECT_FAILURE',
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type NetworkingDisconnectResponse = {|
  ssid: string,
|}

// action union

export type NetworkingAction =
  | FetchStatusAction
  | FetchStatusSuccessAction
  | FetchStatusFailureAction
  | FetchWifiListAction
  | FetchWifiListSuccessAction
  | FetchWifiListFailureAction
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

// state types

export type WifiKey = {|
  ...ApiTypes.ApiWifiKey,
  // if the api key was added by a specific request, add the ID in networking
  // state so the UI can track which key it added
  requestId?: string,
|}

export type PerRobotNetworkingState = $Shape<{|
  internetStatus?: ApiTypes.InternetStatus,
  interfaces?: ApiTypes.InterfaceStatusMap,
  wifiList?: Array<ApiTypes.WifiNetwork>,
  wifiKeyIds?: Array<string>,
  wifiKeysById?: $Shape<{| [id: string]: WifiKey |}>,
  eapOptions?: Array<ApiTypes.EapOption>,
|}>

export type NetworkingState = $Shape<{|
  [robotName: string]: void | PerRobotNetworkingState,
|}>

// selector types

export type SimpleInterfaceStatus = {|
  ipAddress: string | null,
  subnetMask: string | null,
  macAddress: string,
  type: ApiTypes.InterfaceType,
|}

export type InterfaceStatusByType = {|
  wifi: SimpleInterfaceStatus | null,
  ethernet: SimpleInterfaceStatus | null,
|}
