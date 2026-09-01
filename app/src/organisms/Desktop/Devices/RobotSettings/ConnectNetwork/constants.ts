export {
  AUTH_TYPE_FILE,
  AUTH_TYPE_PASSWORD,
  AUTH_TYPE_STRING,
  SECURITY_NONE,
  SECURITY_WPA_EAP,
  SECURITY_WPA_PSK,
} from '@opentrons/api-client'

// NOTE: must match WifiConfigureRequest type
export const CONFIGURE_FIELD_SSID: 'ssid' = 'ssid'
export const CONFIGURE_FIELD_PSK: 'psk' = 'psk'
export const CONFIGURE_FIELD_SECURITY_TYPE: 'securityType' = 'securityType'
export const CONFIGURE_PSK_MIN_LENGTH = 8

export const CONNECT: 'connect' = 'connect'
export const DISCONNECT: 'disconnect' = 'disconnect'
export const JOIN_OTHER: 'join-other' = 'join-other'

export const FIELD_TYPE_TEXT: 'text' = 'text'
export const FIELD_TYPE_KEY_FILE: 'key-file' = 'key-file'
export const FIELD_TYPE_SECURITY: 'security' = 'security'
