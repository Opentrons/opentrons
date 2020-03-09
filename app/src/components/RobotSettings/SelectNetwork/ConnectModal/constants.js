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
} from '../../../../networking'

export const AUTH_TYPE_SECURITY_INTERNAL: 'security' = 'security'

export const FIELD_NAME_SECURITY_INTERNAL: '__securityInternal__' =
  '__securityInternal__'

// TODO(mc, 2020-03-04): i18n
export const LABEL_SSID = 'Network Name (SSID)'
export const LABEL_PSK = 'Password'
export const LABEL_SECURITY = 'Authentication'
export const LABEL_SECURITY_NONE = 'None'
export const LABEL_SECURITY_PSK = 'WPA2 Personal'
export const LABEL_ADD_NEW_KEY = 'Add new...'
export const LABEL_SHOW_PASSWORD = 'Show password'

export const PLACEHOLDER_SELECT_SECURITY = 'Select authentication method'
export const PLACEHOLDER_SELECT_FILE = 'Select file'

export const IS_REQUIRED = 'is required'
export const MUST_BE_8_CHARACTERS = 'must be at least 8 characters'
