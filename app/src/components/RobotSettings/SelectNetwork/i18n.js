// @flow
// TODO(mc, 2020-03-11): i18n

import {
  SECURITY_WPA_PSK,
  SECURITY_WPA_EAP,
  SECURITY_NONE,
} from '../../../networking'

import type { WifiNetwork } from './types'

const SECURITY_DESC = {
  [SECURITY_WPA_PSK]: 'requires a WPA2 password',
  [SECURITY_WPA_EAP]: 'requires 802.1X authentication',
  [SECURITY_NONE]: 'is unsecured',
}

export const FIND_AND_JOIN_A_NETWORK = 'Find and join a Wi-Fi network'

export const ENTER_NAME_AND_SECURITY_TYPE =
  'Enter the network name and security type.'

const WIFI_NETWORK = 'Wi-Fi network'

export const CANCEL = 'cancel'

export const CONNECT = 'connect'

export const CLOSE = 'close'

export const DISCONNECT = 'disconnect'

export const LABEL_SSID = 'Network Name (SSID)'

export const LABEL_PSK = 'Password'

export const LABEL_SECURITY = 'Authentication'

export const LABEL_SECURITY_NONE = 'None'

export const LABEL_SECURITY_PSK = 'WPA2 Personal'

export const LABEL_ADD_NEW_KEY = 'Add new...'

export const LABEL_SHOW_PASSWORD = 'Show password'

export const LABEL_JOIN_OTHER_NETWORK = 'Join other network...'

export const SELECT_AUTHENTICATION_METHOD = 'Select authentication method'

export const SELECT_FILE = 'Select file'

export const SELECT_NETWORK = 'Select network'

export const SUCCESSFULLY_DISCONNECTED = 'Successfully disconnected from Wi-Fi'

export const SUCCESSFULLY_CONNECTED = 'Successfully connected to Wi-Fi'

export const UNABLE_TO_DISCONNECT = 'Unable to disconnect from Wi-Fi'

export const UNABLE_TO_CONNECT = 'Unable to connect to Wi-Fi'

export const CHECK_YOUR_CREDENTIALS =
  'Please double-check your network credentials'

export const CONNECT_TO_SSID = (ssid: string) => `Connect to ${ssid}`

export const DISCONNECT_FROM_SSID = (ssid: string) => `Disconnect from ${ssid}`

export const ARE_YOU_SURE_YOU_WANT_TO_DISCONNECT = (ssid: string) =>
  `Are you sure you want to disconnect from ${ssid}?`

export const NETWORK_REQUIRES_SECURITY = (network: WifiNetwork) =>
  `${WIFI_NETWORK} ${network.ssid} ${SECURITY_DESC[network.securityType]}`

export const FIELD_IS_REQUIRED = (name: string) => `${name} is required`

export const FIELD_NOT_LONG_ENOUGH = (name: string, minLength: number) =>
  `${name} must be at least ${minLength} characters`

const renderMaybeSsid = (ssid: string | null) =>
  ssid !== null ? ` network ${ssid}` : ''

export const CONNECTING_TO_NETWORK = (ssid: string | null) =>
  `Connecting to Wi-Fi${renderMaybeSsid(ssid)}`

export const DISCONNECTING_FROM_NETWORK = (ssid: string | null) =>
  `Disconnecting from Wi-Fi${renderMaybeSsid(ssid)}`

export const YOUR_ROBOT_WAS_UNABLE_TO_CONNECT = (ssid: string | null) =>
  `Your robot was unable to connect to Wi-Fi${renderMaybeSsid(ssid)}`

export const YOUR_ROBOT_WAS_UNABLE_TO_DISCONNECT = (ssid: string | null) =>
  `Your robot was unable to disconnect from Wi-Fi${renderMaybeSsid(ssid)}`

export const YOUR_ROBOT_HAS_DISCONNECTED = (ssid: string | null) =>
  `Your robot has successfully disconnected from Wi-Fi${renderMaybeSsid(ssid)}`

export const YOUR_ROBOT_HAS_CONNECTED = (ssid: string | null) =>
  `Your robot has successfully connected to Wi-Fi${renderMaybeSsid(ssid)}`
