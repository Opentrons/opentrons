// @flow

export {
  AUTH_TYPE_STRING,
  AUTH_TYPE_PASSWORD,
  AUTH_TYPE_FILE,
  SECURITY_NONE,
  SECURITY_WPA_EAP,
  SECURITY_WPA_PSK,
  CONFIGURE_FIELD_SSID,
  CONFIGURE_FIELD_PSK,
  CONFIGURE_FIELD_SECURITY_TYPE,
  CONFIGURE_PSK_MIN_LENGTH,
} from '../../../networking'

export const CONNECT: 'connect' = 'connect'
export const DISCONNECT: 'disconnect' = 'disconnect'
export const JOIN_OTHER: 'join-other' = 'join-other'

export const FIELD_TYPE_TEXT: 'text' = 'text'
export const FIELD_TYPE_KEY_FILE: 'key-file' = 'key-file'
export const FIELD_TYPE_SECURITY: 'security' = 'security'
