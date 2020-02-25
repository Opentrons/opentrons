// @flow

import type { RobotApiRequestMeta } from '../robot-api/types'
import typeof {
  STATUS_NONE,
  STATUS_PORTAL,
  STATUS_LIMITED,
  STATUS_FULL,
  STATUS_UNKNOWN,
  INTERFACE_CONNECTED,
  INTERFACE_CONNECTING,
  INTERFACE_DISCONNECTED,
  INTERFACE_UNAVAILABLE,
  INTERFACE_WIFI,
  INTERFACE_ETHERNET,
  SECURITY_NONE,
  SECURITY_WPA_PSK,
  SECURITY_WPA_EAP,
  FETCH_STATUS,
  FETCH_STATUS_SUCCESS,
  FETCH_STATUS_FAILURE,
  FETCH_WIFI_LIST,
  FETCH_WIFI_LIST_SUCCESS,
  FETCH_WIFI_LIST_FAILURE,
} from './constants'

// response types

// GET /networking/status

export type InternetStatus =
  | STATUS_NONE
  | STATUS_PORTAL
  | STATUS_LIMITED
  | STATUS_FULL
  | STATUS_UNKNOWN

export type InterfaceState =
  | INTERFACE_CONNECTED
  | INTERFACE_CONNECTING
  | INTERFACE_DISCONNECTED
  | INTERFACE_UNAVAILABLE

export type InterfaceType = INTERFACE_WIFI | INTERFACE_ETHERNET

export type InterfaceStatus = {|
  ipAddress: string | null,
  macAddress: string,
  gatewayAddress: string | null,
  state: InterfaceState,
  type: InterfaceType,
|}

export type InterfaceStatusMap = $Shape<{|
  [device: string]: InterfaceStatus,
|}>

export type NetworkingStatusResponse = {|
  status: InternetStatus,
  interfaces: InterfaceStatusMap,
|}

// GET /wifi/list

export type WifiSecurityType =
  | SECURITY_NONE
  | SECURITY_WPA_PSK
  | SECURITY_WPA_EAP

export type WifiNetwork = {|
  ssid: string,
  signal: number,
  active: boolean,
  security: string,
  securityType: WifiSecurityType,
|}

export type WifiListResponse = {|
  list: Array<WifiNetwork>,
|}

// action types

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
    internetStatus: InternetStatus,
    interfaces: InterfaceStatusMap,
  |},
  meta: RobotApiRequestMeta,
|}

export type FetchStatusFailureAction = {|
  type: FETCH_STATUS_FAILURE,
  payload: {| robotName: string, error: {} |},
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
  payload: {| robotName: string, wifiList: Array<WifiNetwork> |},
  meta: RobotApiRequestMeta,
|}

export type FetchWifiListFailureAction = {|
  type: FETCH_WIFI_LIST_FAILURE,
  payload: {| robotName: string, error: {} |},
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

// state types

export type PerRobotNetworkingState = $Shape<{|
  internetStatus: InternetStatus,
  interfaces: InterfaceStatusMap,
  wifiList: Array<WifiNetwork>,
|}>

export type NetworkingState = $Shape<{|
  [robotName: string]: void | PerRobotNetworkingState,
|}>

// selector types

export type SimpleInterfaceStatus = {|
  ipAddress: string | null,
  subnetMask: string | null,
  macAddress: string,
  type: InterfaceType,
|}

export type InterfaceStatusByType = {|
  wifi: SimpleInterfaceStatus | null,
  ethernet: SimpleInterfaceStatus | null,
|}
