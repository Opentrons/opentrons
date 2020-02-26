// @flow

import type { RobotApiRequestMeta } from '../robot-api/types'

import typeof {
  FETCH_STATUS,
  FETCH_STATUS_SUCCESS,
  FETCH_STATUS_FAILURE,
  FETCH_WIFI_LIST,
  FETCH_WIFI_LIST_SUCCESS,
  FETCH_WIFI_LIST_FAILURE,
  POST_WIFI_CONFIGURE,
  POST_WIFI_CONFIGURE_SUCCESS,
  POST_WIFI_CONFIGURE_FAILURE,
} from './constants'

import * as ApiTypes from './api-types'

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
  payload: {| robotName: string, error: { ... } |},
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
  payload: {| robotName: string, error: { ... } |},
  meta: RobotApiRequestMeta,
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

// state types

export type PerRobotNetworkingState = $Shape<{|
  internetStatus: ApiTypes.InternetStatus,
  interfaces: ApiTypes.InterfaceStatusMap,
  wifiList: Array<ApiTypes.WifiNetwork>,
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
