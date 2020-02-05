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

// action types

// fetch status

export type FetchStatusAction = {|
  type: 'networking:FETCH_STATUS',
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchStatusSuccessAction = {|
  type: 'networking:FETCH_STATUS_SUCCESS',
  payload: {|
    robotName: string,
    internetStatus: InternetStatus,
    interfaces: InterfaceStatusMap,
  |},
  meta: RobotApiRequestMeta,
|}

export type FetchStatusFailureAction = {|
  type: 'networking:FETCH_STATUS_FAILURE',
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

// action union

export type NetworkingAction =
  | FetchStatusAction
  | FetchStatusSuccessAction
  | FetchStatusFailureAction

// state types

export type PerRobotNetworkingState = $Shape<{|
  internetStatus: InternetStatus,
  interfaces: InterfaceStatusMap,
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
