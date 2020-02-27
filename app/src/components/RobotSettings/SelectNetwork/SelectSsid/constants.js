// @flow

export const DISCONNECT_WIFI_VALUE = '__disconnect-from-wifi__'
export const DISCONNECT_WIFI_LABEL = 'Disconnect from Wifi'
export const JOIN_OTHER_VALUE = '__join-other-network__'
export const JOIN_OTHER_LABEL = 'Join other network...'

export const ACTIONS = {
  [JOIN_OTHER_VALUE]: JOIN_OTHER_LABEL,
  [DISCONNECT_WIFI_VALUE]: DISCONNECT_WIFI_LABEL,
}

export const SELECT_ADDITIONAL_ACTIONS = {
  options: [{ value: JOIN_OTHER_VALUE }, { value: DISCONNECT_WIFI_VALUE }],
}

export const SELECT_JOIN_ACTIONS_OPTIONS = {
  options: [{ value: JOIN_OTHER_VALUE }],
}

export const FIELD_NAME = 'ssid'

export const SIGNAL_LEVEL_LOW = 25
export const SIGNAL_LEVEL_MED = 50
export const SIGNAL_LEVEL_HIGH = 75
