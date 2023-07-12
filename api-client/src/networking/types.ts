export const SECURITY_NONE: 'none' = 'none'
export const SECURITY_WPA_PSK: 'wpa-psk' = 'wpa-psk'
export const SECURITY_WPA_EAP: 'wpa-eap' = 'wpa-eap'

// GET /wifi/list

export type WifiSecurityType =
  | typeof SECURITY_NONE
  | typeof SECURITY_WPA_PSK
  | typeof SECURITY_WPA_EAP

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
