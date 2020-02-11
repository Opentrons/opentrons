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

// http request paths

export const STATUS_PATH: '/networking/status' = '/networking/status'

// action type strings

export const FETCH_STATUS: 'networking:FETCH_STATUS' = 'networking:FETCH_STATUS'

export const FETCH_STATUS_SUCCESS: 'networking:FETCH_STATUS_SUCCESS' =
  'networking:FETCH_STATUS_SUCCESS'

export const FETCH_STATUS_FAILURE: 'networking:FETCH_STATUS_FAILURE' =
  'networking:FETCH_STATUS_FAILURE'
