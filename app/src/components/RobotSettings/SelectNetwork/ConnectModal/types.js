// @flow
import type { WifiSecurityType } from '../types'

import typeof {
  AUTH_TYPE_STRING,
  AUTH_TYPE_PASSWORD,
  AUTH_TYPE_FILE,
  AUTH_TYPE_SECURITY_INTERNAL,
} from './constants'

export type {
  WifiAuthField,
  WifiNetwork,
  WifiSecurityType,
  WifiKey,
  EapOption,
  WifiConfigureRequest,
} from '../types'

export type ConnectFormValues = $Shape<{|
  ssid?: string,
  psk?: string,
  securityType?: WifiSecurityType,
  eapConfig?: {|
    [eapOption: string]: string,
    eapType: string,
  |},
|}>

export type ConnectFormErrors = $Shape<{|
  [field: string]: string,
|}>

export type ConnectFormTouched = $Shape<{|
  [field: string]: boolean,
|}>

export type ConnectFormFieldType =
  | AUTH_TYPE_STRING
  | AUTH_TYPE_PASSWORD
  | AUTH_TYPE_FILE
  | AUTH_TYPE_SECURITY_INTERNAL

export type ConnectFormField = {|
  type: ConnectFormFieldType,
  name: string,
  label: string,
  required: boolean,
|}
