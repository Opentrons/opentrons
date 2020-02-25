// @flow

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

// http request paths

export const STATUS_PATH: '/networking/status' = '/networking/status'
export const WIFI_LIST_PATH: '/wifi/list' = '/wifi/list'
export const WIFI_CONFIGURE_PATH: '/wifi/configure' = '/wifi/configure'
export const WIFI_KEYS_PATH: '/wifi/keys' = '/wifi/keys'
export const EAP_OPTIONS_PATH: '/wifi/eap-options' = '/wifi/eap-options'

// action type strings

// GET /networking/status

export const FETCH_STATUS: 'networking:FETCH_STATUS' = 'networking:FETCH_STATUS'

export const FETCH_STATUS_SUCCESS: 'networking:FETCH_STATUS_SUCCESS' =
  'networking:FETCH_STATUS_SUCCESS'

export const FETCH_STATUS_FAILURE: 'networking:FETCH_STATUS_FAILURE' =
  'networking:FETCH_STATUS_FAILURE'

// GET /wifi/list

export const FETCH_WIFI_LIST: 'networking:FETCH_WIFI_LIST' =
  'networking:FETCH_WIFI_LIST'

export const FETCH_WIFI_LIST_SUCCESS: 'networking:FETCH_WIFI_LIST_SUCCESS' =
  'networking:FETCH_WIFI_LIST_SUCCESS'

export const FETCH_WIFI_LIST_FAILURE: 'networking:FETCH_WIFI_LIST_FAILURE' =
  'networking:FETCH_WIFI_LIST_FAILURE'

// POST /wifi/configure

export const POST_WIFI_CONFIGURE: 'networking:POST_WIFI_CONFIGURE' =
  'networking:POST_WIFI_CONFIGURE'

export const POST_WIFI_CONFIGURE_SUCCESS: 'networking:POST_WIFI_CONFIGURE_SUCCESS' =
  'networking:POST_WIFI_CONFIGURE_SUCCESS'

export const POST_WIFI_CONFIGURE_FAILURE: 'networking:POST_WIFI_CONFIGURE_FAILURE' =
  'networking:POST_WIFI_CONFIGURE_FAILURE'

// GET /wifi/keys

export const FETCH_WIFI_KEYS: 'networking:FETCH_WIFI_KEYS' =
  'networking:FETCH_WIFI_KEYS'

export const FETCH_WIFI_KEYS_SUCCESS: 'networking:FETCH_WIFI_KEYS_SUCCESS' =
  'networking:FETCH_WIFI_KEYS_SUCCESS'

export const FETCH_WIFI_KEYS_FAILURE: 'networking:FETCH_WIFI_KEYS_FAILURE' =
  'networking:FETCH_WIFI_KEYS_FAILURE'

// POST /wifi/keys

export const POST_WIFI_KEYS: 'networking:POST_WIFI_KEYS' =
  'networking:POST_WIFI_KEYS'

export const POST_WIFI_KEYS_SUCCESS: 'networking:POST_WIFI_KEYS_SUCCESS' =
  'networking:POST_WIFI_KEYS_SUCCESS'

export const POST_WIFI_KEYS_FAILURE: 'networking:POST_WIFI_KEYS_FAILURE' =
  'networking:POST_WIFI_KEYS_FAILURE'

// GET /wifi/eap-options

export const FETCH_EAP_OPTIONS: 'networking:FETCH_EAP_OPTIONS' =
  'networking:FETCH_EAP_OPTIONS'

export const FETCH_EAP_OPTIONS_SUCCESS: 'networking:FETCH_EAP_OPTIONS_SUCCESS' =
  'networking:FETCH_EAP_OPTIONS_SUCCESS'

export const FETCH_EAP_OPTIONS_FAILURE: 'networking:FETCH_EAP_OPTIONS_FAILURE' =
  'networking:FETCH_EAP_OPTIONS_FAILURE'
