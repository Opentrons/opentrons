// @flow

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
} from './constants'

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

// POST /wifi/configure

export type WifiConfigureRequest = {|
  ssid: string,
  psk?: string,
  securityType?: WifiSecurityType,
  hidden?: boolean,
  eapConfig?: {|
    [eapOption: string]: string,
    eapType: string,
  |},
|}

export type WifiConfigureResponse = {|
  ssid: string,
  message: string,
|}

// GET /wifi/keys

export type WifiKey = {|
  id: string,
  uri: string,
  name: string,
|}

export type FetchWifiKeysResponse = {|
  keys: Array<WifiKey>,
|}

// POST /wifi/keys

export type PostWifiKeysResponse = {|
  ...WifiKey,
  message?: string,
|}
