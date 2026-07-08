import type {
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
  | typeof STATUS_NONE
  | typeof STATUS_PORTAL
  | typeof STATUS_LIMITED
  | typeof STATUS_FULL
  | typeof STATUS_UNKNOWN

export type InterfaceState =
  | typeof INTERFACE_CONNECTED
  | typeof INTERFACE_CONNECTING
  | typeof INTERFACE_DISCONNECTED
  | typeof INTERFACE_UNAVAILABLE

export type InterfaceType = typeof INTERFACE_WIFI | typeof INTERFACE_ETHERNET

export interface InterfaceStatus {
  ipAddress: string | null
  macAddress: string
  gatewayAddress: string | null
  state: InterfaceState
  type: InterfaceType
}

export type InterfaceStatusMap = Partial<{
  [device: string]: InterfaceStatus
}>

export interface NetworkingStatusResponse {
  status: InternetStatus
  interfaces: InterfaceStatusMap
}

// GET /wifi/list

export type WifiSecurityType =
  typeof SECURITY_NONE | typeof SECURITY_WPA_PSK | typeof SECURITY_WPA_EAP

export interface WifiNetwork {
  ssid: string
  signal: number
  active: boolean
  security: string
  securityType: WifiSecurityType
}

export interface WifiListResponse {
  list: WifiNetwork[]
}

// POST /wifi/configure

export interface WifiEapConfig {
  [eapOption: string]: string
  eapType: string
}

export interface WifiConfigureRequest {
  ssid: string
  psk?: string
  securityType?: WifiSecurityType
  hidden?: boolean
  eapConfig?: WifiEapConfig
}

export interface WifiConfigureResponse {
  ssid: string
  message: string
}

// GET /wifi/eap-options

export type WifiAuthFieldType =
  typeof AUTH_TYPE_STRING | typeof AUTH_TYPE_PASSWORD | typeof AUTH_TYPE_FILE

export interface WifiAuthField {
  name: string
  displayName: string
  required: boolean
  type: WifiAuthFieldType
}

export interface EapOption {
  name: string
  // displayName added to response in API v3.4.0
  displayName?: string
  options: WifiAuthField[]
}

export interface FetchEapOptionsResponse {
  options: EapOption[]
}
