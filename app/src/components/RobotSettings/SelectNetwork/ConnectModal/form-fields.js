// @flow
import get from 'lodash/get'
import * as Constants from './constants'

import type {
  WifiNetwork,
  EapOption,
  WifiAuthField,
  WifiConfigureRequest,
  ConnectFormValues,
  ConnectFormErrors,
  ConnectFormField,
} from './types'

const FIELD_SSID = {
  type: Constants.AUTH_TYPE_STRING,
  name: Constants.CONFIGURE_FIELD_SSID,
  label: Constants.LABEL_SSID,
  required: true,
}

const FIELD_SECURITY = {
  type: Constants.AUTH_TYPE_SECURITY_INTERNAL,
  name: Constants.CONFIGURE_FIELD_SECURITY_TYPE,
  label: Constants.LABEL_SECURITY,
  required: true,
}

const FIELD_PSK = {
  type: Constants.AUTH_TYPE_PASSWORD,
  name: Constants.CONFIGURE_FIELD_PSK,
  label: Constants.LABEL_PSK,
  required: true,
}

const getEapFields = (eapOptions, values): Array<ConnectFormField> => {
  const eapType = values.eapConfig?.eapType
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
    values.securityType === Constants.SECURITY_WPA_PSK
  ) {
    fields.push(FIELD_PSK)
  }

  // if known network is EAP or user selected EAP, map eap options to fields
  if (
    network?.securityType === Constants.SECURITY_WPA_EAP ||
    values.securityType === Constants.SECURITY_WPA_EAP
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
  const errors = {}
  if (network === null && !values.ssid) {
    errors.ssid = `${Constants.LABEL_SSID} ${Constants.IS_REQUIRED}`
  }

  if (
    (network === null && !values.securityType) ||
    (network?.securityType === Constants.SECURITY_WPA_EAP &&
      !values.eapConfig?.eapType)
  ) {
    errors.securityType = `${Constants.LABEL_SECURITY} ${Constants.IS_REQUIRED}`
  }

  if (
    !values.psk &&
    (network?.securityType === Constants.SECURITY_WPA_PSK ||
      values.securityType === Constants.SECURITY_WPA_PSK)
  ) {
    errors.psk = `${Constants.LABEL_PSK} ${Constants.MUST_BE_8_CHARACTERS}`
  }

  if (
    network?.securityType === Constants.SECURITY_WPA_EAP ||
    values.securityType === Constants.SECURITY_WPA_EAP
  ) {
    getEapFields(eapOptions, values)
      .filter(({ name, required }) => required && !get(values, name))
      .forEach(({ name, label }) => {
        errors[name] = `${label} ${Constants.IS_REQUIRED}`
      })
  }

  return errors
}

export const connectFormToConfigureRequest = (
  network: WifiNetwork | null,
  values: ConnectFormValues
): WifiConfigureRequest | null => {
  const ssid = network?.ssid ?? values.ssid ?? null

  if (ssid !== null) {
    const options: WifiConfigureRequest = { ssid, hidden: network === null }
    const securityType = network?.securityType ?? values.securityType

    if (securityType) options.securityType = securityType
    if (values.psk != null) options.psk = values.psk
    if (values.eapConfig) options.eapConfig = values.eapConfig
    return options
  }

  return null
}
