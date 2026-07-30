export const SECURITY_NONE: 'none' = 'none'
export const SECURITY_WPA_PSK: 'wpa-psk' = 'wpa-psk'
export const SECURITY_WPA_EAP: 'wpa-eap' = 'wpa-eap'

export const STATUS_NONE: 'none' = 'none'
export const STATUS_PORTAL: 'portal' = 'portal'
export const STATUS_LIMITED: 'limited' = 'limited'
export const STATUS_FULL: 'full' = 'full'
export const STATUS_UNKNOWN: 'unknown' = 'unknown'

export const INTERFACE_CONNECTED: 'connected' = 'connected'
export const INTERFACE_CONNECTING: 'connecting' = 'connecting'
export const INTERFACE_DISCONNECTED: 'disconnected' = 'disconnected'
export const INTERFACE_UNAVAILABLE: 'unavailable' = 'unavailable'

export const INTERFACE_WIFI: 'wifi' = 'wifi'
export const INTERFACE_ETHERNET: 'ethernet' = 'ethernet'

export const AUTH_TYPE_STRING: 'string' = 'string'
export const AUTH_TYPE_PASSWORD: 'password' = 'password'
export const AUTH_TYPE_FILE: 'file' = 'file'

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

export interface WifiKey {
  id: string
  uri: string
  name: string
}

export interface WifiKeysResponse {
  keys: WifiKey[]
}

export interface PostWifiKeysResponse extends WifiKey {
  message?: string
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

export interface EapOptionsResponse {
  options: EapOption[]
}

// POST /wifi/disconnect

export interface WifiDisconnectRequest {
  ssid: string
}

export interface WifiDisconnectResponse {
  message: string
}
