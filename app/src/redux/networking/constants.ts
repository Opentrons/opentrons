// common constants

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

export const SECURITY_NONE: 'none' = 'none'
export const SECURITY_WPA_PSK: 'wpa-psk' = 'wpa-psk'
export const SECURITY_WPA_EAP: 'wpa-eap' = 'wpa-eap'

export const AUTH_TYPE_STRING: 'string' = 'string'
export const AUTH_TYPE_PASSWORD: 'password' = 'password'
export const AUTH_TYPE_FILE: 'file' = 'file'

// NOTE: must match WifiConfigureRequest type
export const CONFIGURE_FIELD_SSID: 'ssid' = 'ssid'
export const CONFIGURE_FIELD_PSK: 'psk' = 'psk'
export const CONFIGURE_FIELD_SECURITY_TYPE: 'securityType' = 'securityType'
export const CONFIGURE_PSK_MIN_LENGTH = 8
