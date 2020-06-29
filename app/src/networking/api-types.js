// @flow

import typeof {
  AUTH_TYPE_FILE,
  AUTH_TYPE_PASSWORD,
  AUTH_TYPE_STRING,
  INTERFACE_CONNECTED,
  INTERFACE_CONNECTING,
  INTERFACE_DISCONNECTED,
  INTERFACE_ETHERNET,
  INTERFACE_UNAVAILABLE,
  INTERFACE_WIFI,
  SECURITY_NONE,
  SECURITY_WPA_EAP,
  SECURITY_WPA_PSK,
  STATUS_FULL,
  STATUS_LIMITED,
  STATUS_NONE,
  STATUS_PORTAL,
  STATUS_UNKNOWN,
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

export type WifiEapConfig = {|
  [eapOption: string]: string,
  eapType: string,
|}

export type WifiConfigureRequest = {|
  ssid: string,
  psk?: string,
  securityType?: WifiSecurityType,
  hidden?: boolean,
  eapConfig?: WifiEapConfig,
|}

export type WifiConfigureResponse = {|
  ssid: string,
  message: string,
|}

// GET /wifi/keys

export type ApiWifiKey = {|
  id: string,
  uri: string,
  name: string,
|}

export type FetchWifiKeysResponse = {|
  keys: Array<ApiWifiKey>,
|}

// POST /wifi/keys

export type PostWifiKeysResponse = {|
  ...ApiWifiKey,
  message?: string,
|}

// GET /wifi/eap-options

export type WifiAuthFieldType =
  | AUTH_TYPE_STRING
  | AUTH_TYPE_PASSWORD
  | AUTH_TYPE_FILE

export type WifiAuthField = {|
  name: string,
  displayName: string,
  required: boolean,
  type: WifiAuthFieldType,
|}

export type EapOption = {|
  name: string,
  // displayName added to response in API v3.4.0
  displayName?: string,
  options: Array<WifiAuthField>,
|}

export type FetchEapOptionsResponse = {|
  options: Array<EapOption>,
|}
