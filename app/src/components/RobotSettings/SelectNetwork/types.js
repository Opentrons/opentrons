// @flow
import type { FormikErrors } from 'formik'

import type { WifiNetwork, EapOption, WifiKey } from '../../../networking/types'

import typeof {
  CONNECT,
  DISCONNECT,
  JOIN_OTHER,
  FIELD_TYPE_TEXT,
  FIELD_TYPE_KEY_FILE,
  FIELD_TYPE_SECURITY,
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

type ConnectFormFieldCommon = {|
  name: string,
  label: string,
|}

export type ConnectFormTextField = {|
  ...ConnectFormFieldCommon,
  type: FIELD_TYPE_TEXT,
  isPassword: boolean,
|}

export type ConnectFormKeyField = {|
  ...ConnectFormFieldCommon,
  type: FIELD_TYPE_KEY_FILE,
  robotName: string,
  wifiKeys: Array<WifiKey>,
  placeholder: string,
|}

// UI only auth field; server will never return this field type
export type ConnectFormSecurityField = {|
  ...ConnectFormFieldCommon,
  type: FIELD_TYPE_SECURITY,
  eapOptions: Array<EapOption>,
  showAllOptions: boolean,
  placeholder: string,
|}

export type ConnectFormField =
  | ConnectFormTextField
  | ConnectFormKeyField
  | ConnectFormSecurityField

export type ConnectFormFieldProps = $ReadOnly<{|
  value: string | null,
  error: string | null,
  onChange: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  onBlur: (event: SyntheticFocusEvent<HTMLInputElement>) => mixed,
  setValue: (value: string) => mixed,
  setTouched: (touched: boolean) => mixed,
|}>
