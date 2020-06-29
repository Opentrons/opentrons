// @flow
import get from 'lodash/get'

import * as Constants from '../constants'
import * as Copy from '../i18n'
import type {
  ConnectFormErrors,
  ConnectFormField,
  ConnectFormSecurityField,
  ConnectFormTextField,
  ConnectFormValues,
  EapOption,
  WifiAuthField,
  WifiConfigureRequest,
  WifiEapConfig,
  WifiKey,
  WifiNetwork,
  WifiSecurityType,
} from '../types'

export const renderLabel = (label: string, required: boolean): string =>
  `${required ? '* ' : ''}${label}`

const FIELD_SSID: ConnectFormTextField = {
  type: Constants.FIELD_TYPE_TEXT,
  name: Constants.CONFIGURE_FIELD_SSID,
  label: renderLabel(Copy.LABEL_SSID, true),
  isPassword: false,
}

const FIELD_PSK: ConnectFormTextField = {
  type: Constants.FIELD_TYPE_TEXT,
  name: Constants.CONFIGURE_FIELD_PSK,
  label: renderLabel(Copy.LABEL_PSK, true),
  isPassword: true,
}

const makeSecurityField = (
  eapOptions: Array<EapOption>,
  showAllOptions: boolean
): ConnectFormSecurityField => ({
  type: Constants.FIELD_TYPE_SECURITY,
  name: Constants.CONFIGURE_FIELD_SECURITY_TYPE,
  label: renderLabel(Copy.LABEL_SECURITY, true),
  placeholder: Copy.SELECT_AUTHENTICATION_METHOD,
  eapOptions,
  showAllOptions,
})

const getEapIsSelected = (formSecurityType): boolean %checks => {
  return (
    formSecurityType != null &&
    formSecurityType !== Constants.SECURITY_NONE &&
    formSecurityType !== Constants.SECURITY_WPA_PSK
  )
}

const getEapFields = (
  eapOptions,
  values,
  errors,
  touched
): Array<WifiAuthField> => {
  const eapType = values.securityType
  return eapOptions
    .filter(opt => opt.name === eapType)
    .flatMap(opt => opt.options)
}

const getEapFieldName = baseName => `eapConfig.${baseName}`

export function getConnectFormFields(
  network: WifiNetwork | null,
  robotName: string,
  eapOptions: Array<EapOption>,
  wifiKeys: Array<WifiKey>,
  values: ConnectFormValues
): Array<ConnectFormField> {
  const { securityType: formSecurityType } = values
  const fields = []

  // if the network is unknown, display a field to enter the SSID
  if (network === null) {
    fields.push(FIELD_SSID)
  }

  // if the network is unknown or the known network is EAP, display a
  // security dropdown; security dropdown will handle which options to
  // display based on known or unknown network
  if (!network || network.securityType === Constants.SECURITY_WPA_EAP) {
    fields.push(makeSecurityField(eapOptions, !network))
  }

  // if known network is PSK or network is unknown and user has selected PSK
  // display a password field for the PSK
  if (
    network?.securityType === Constants.SECURITY_WPA_PSK ||
    formSecurityType === Constants.SECURITY_WPA_PSK
  ) {
    fields.push(FIELD_PSK)
  }

  // if known network is EAP or user selected EAP, map eap options to fields
  if (
    network?.securityType === Constants.SECURITY_WPA_EAP ||
    getEapIsSelected(formSecurityType)
  ) {
    fields.push(
      ...getEapFields(eapOptions, values).map(field => {
        const { type } = field
        const name = getEapFieldName(field.name)
        const label = renderLabel(field.displayName, field.required)

        if (type === Constants.AUTH_TYPE_FILE) {
          return {
            type: Constants.FIELD_TYPE_KEY_FILE,
            name,
            label,
            robotName,
            wifiKeys,
            placeholder: Copy.SELECT_FILE,
          }
        }

        return {
          type: Constants.FIELD_TYPE_TEXT,
          name,
          label,
          isPassword: type === Constants.AUTH_TYPE_PASSWORD,
        }
      })
    )
  }

  return fields
}

export function validateConnectFormFields(
  network: WifiNetwork | null,
  eapOptions: Array<EapOption>,
  values: ConnectFormValues
): ConnectFormErrors {
  const {
    ssid: formSsid,
    securityType: formSecurityType,
    psk: formPsk,
  } = values
  const errors: $Shape<ConnectFormErrors> = {}

  if (network === null && !formSsid) {
    errors.ssid = Copy.FIELD_IS_REQUIRED(Copy.LABEL_SSID)
  }

  if (
    (network === null || network.securityType === Constants.SECURITY_WPA_EAP) &&
    !formSecurityType
  ) {
    errors.securityType = Copy.FIELD_IS_REQUIRED(Copy.LABEL_SECURITY)
  }

  if (
    (network?.securityType === Constants.SECURITY_WPA_PSK ||
      formSecurityType === Constants.SECURITY_WPA_PSK) &&
    (!formPsk || formPsk.length < Constants.CONFIGURE_PSK_MIN_LENGTH)
  ) {
    errors.psk = Copy.FIELD_NOT_LONG_ENOUGH(
      Copy.LABEL_PSK,
      Constants.CONFIGURE_PSK_MIN_LENGTH
    )
  }

  if (
    network?.securityType === Constants.SECURITY_WPA_EAP ||
    getEapIsSelected(formSecurityType)
  ) {
    getEapFields(eapOptions, values)
      .filter(
        ({ name, required }) => required && !get(values, getEapFieldName(name))
      )
      .forEach(({ name, displayName }) => {
        errors[getEapFieldName(name)] = Copy.FIELD_IS_REQUIRED(displayName)
      })
  }

  return errors
}

export const connectFormToConfigureRequest = (
  network: WifiNetwork | null,
  values: ConnectFormValues
): WifiConfigureRequest | null => {
  const {
    ssid: formSsid,
    securityType: formSecurityType,
    psk: formPsk,
    eapConfig: formEapConfig,
  } = values

  const ssid = network?.ssid ?? formSsid ?? null
  let securityType: WifiSecurityType | null = null
  let eapConfig: WifiEapConfig | null = null

  if (getEapIsSelected(formSecurityType)) {
    securityType = Constants.SECURITY_WPA_EAP
    eapConfig = { eapType: formSecurityType }
  } else if (network) {
    securityType = network.securityType
  } else if (
    values.securityType === Constants.SECURITY_NONE ||
    values.securityType === Constants.SECURITY_WPA_PSK
  ) {
    // NOTE(mc, 2020-03-13): Flow v0.119 unable to refine via consts
    securityType = ((values.securityType: any): WifiSecurityType)
  }

  if (ssid !== null && securityType !== null) {
    const options: WifiConfigureRequest = {
      ssid,
      securityType,
      hidden: network === null,
    }

    if (formPsk != null) options.psk = formPsk
    if (eapConfig) options.eapConfig = { ...eapConfig, ...formEapConfig }
    return options
  }

  return null
}
