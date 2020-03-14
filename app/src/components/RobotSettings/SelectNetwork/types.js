// @flow
import type { FormikErrors } from 'formik'

import type { WifiNetwork } from '../../../networking/types'

import typeof {
  CONNECT,
  DISCONNECT,
  JOIN_OTHER,
  AUTH_TYPE_STRING,
  AUTH_TYPE_PASSWORD,
  AUTH_TYPE_FILE,
  AUTH_TYPE_SECURITY,
} from './constants'

export type {
  WifiNetwork,
  WifiSecurityType,
  WifiAuthField,
  WifiEapConfig,
  WifiConfigureRequest,
  WifiKey,
  EapOption,
} from '../../../networking/types'

export type NetworkChangeType = CONNECT | DISCONNECT | JOIN_OTHER

export type NetworkChangeState =
  | {| type: CONNECT, ssid: string, network: WifiNetwork |}
  | {| type: DISCONNECT, ssid: string |}
  | {| type: JOIN_OTHER, ssid: string | null |}
  | {| type: null |}

export type ConnectFormValues = $Shape<{|
  ssid?: string,
  psk?: string,
  // securityType form value may be securityType or eapConfig.eapType
  securityType?: string,
  eapConfig?: {|
    [eapOption: string]: string,
  |},
|}>

export type ConnectFormErrors = $Shape<FormikErrors<ConnectFormValues>>

export type ConnectFormFieldType =
  | AUTH_TYPE_STRING
  | AUTH_TYPE_PASSWORD
  | AUTH_TYPE_FILE
  | AUTH_TYPE_SECURITY

export type ConnectFormField = {|
  type: ConnectFormFieldType,
  name: string,
  label: string,
  required: boolean,
|}

export type ConnectFormFieldProps = $ReadOnly<{|
  value: string | null,
  error: string | null,
  onChange: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  onBlur: (event: SyntheticFocusEvent<HTMLInputElement>) => mixed,
  setValue: (value: string) => mixed,
  setTouched: (touched: boolean) => mixed,
|}>
