// @flow

export const DISCONNECT_WIFI_VALUE = '__disconnect-from-wifi__'
export const DISCONNECT_WIFI_LABEL = 'Disconnect from Wifi'
export const JOIN_OTHER_VALUE = '__join-other-network__'
export const JOIN_OTHER_LABEL = 'Join other network...'

export const ACTIONS = {
  [JOIN_OTHER_VALUE]: JOIN_OTHER_LABEL,
  [DISCONNECT_WIFI_VALUE]: DISCONNECT_WIFI_LABEL,
}

export const SELECT_DISCONNECT_GROUP = {
  options: [{ value: DISCONNECT_WIFI_VALUE, label: DISCONNECT_WIFI_LABEL }],
}

export const SELECT_JOIN_OTHER_GROUP = {
  options: [{ value: JOIN_OTHER_VALUE, label: JOIN_OTHER_LABEL }],
}

export const FIELD_NAME = 'ssid'
export const PLACEHOLDER = 'Select network'

export const SIGNAL_LEVEL_LOW = 25
export const SIGNAL_LEVEL_MED = 50
export const SIGNAL_LEVEL_HIGH = 75
