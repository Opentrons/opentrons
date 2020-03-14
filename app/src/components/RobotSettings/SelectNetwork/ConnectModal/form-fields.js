// @flow
import get from 'lodash/get'

import * as Constants from '../constants'
import * as Copy from '../i18n'

import type {
  WifiNetwork,
  EapOption,
  WifiAuthField,
  WifiConfigureRequest,
  WifiSecurityType,
  WifiEapConfig,
  ConnectFormValues,
  ConnectFormErrors,
  ConnectFormField,
} from '../types'

const FIELD_SSID = {
  type: Constants.AUTH_TYPE_STRING,
  name: Constants.CONFIGURE_FIELD_SSID,
  label: Copy.LABEL_SSID,
  required: true,
}

const FIELD_SECURITY = {
  type: Constants.AUTH_TYPE_SECURITY,
  name: Constants.CONFIGURE_FIELD_SECURITY_TYPE,
  label: Copy.LABEL_SECURITY,
  required: true,
}

const FIELD_PSK = {
  type: Constants.AUTH_TYPE_PASSWORD,
  name: Constants.CONFIGURE_FIELD_PSK,
  label: Copy.LABEL_PSK,
  required: true,
}

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
): Array<ConnectFormField> => {
  const eapType = values.securityType
  return eapOptions
    .filter(opt => opt.name === eapType)
    .flatMap(opt => opt.options)
    .map(({ type, name, displayName, required }: WifiAuthField) => ({
      type,
      required,
      label: displayName ?? name,
      name: `eapConfig.${name}`,
    }))
}

export function getConnectFormFields(
  network: WifiNetwork | null,
  eapOptions: Array<EapOption>,
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
    fields.push(FIELD_SECURITY)
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
    fields.push(...getEapFields(eapOptions, values))
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
      .filter(({ name, required }) => required && !get(values, name))
      .forEach(({ name, label }) => {
        errors[name] = Copy.FIELD_IS_REQUIRED(label)
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
