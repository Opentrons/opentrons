// @flow

export const LIST_REFRESH_MS = 15000
export const ACTIVE = 'active'

export const CONNECT: 'connect' = 'connect'
export const DISCONNECT: 'disconnect' = 'disconnect'
export const JOIN_OTHER: 'join-other' = 'join-other'

export const DISCONNECT_WIFI_VALUE = '__disconnect-from-wifi__'
export const DISCONNECT_WIFI_LABEL = 'Disconnect from Wifi'
export const JOIN_OTHER_VALUE = '__join-other-network__'
export const JOIN_OTHER_LABEL = 'Join other network...'

export const NETWORKING_TYPE = {
  [DISCONNECT_WIFI_VALUE]: DISCONNECT,
  [JOIN_OTHER_VALUE]: JOIN_OTHER,
}
