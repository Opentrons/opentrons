import get from 'lodash/get'
import { FieldError } from 'react-hook-form'

import * as Constants from '../constants'
import * as Copy from '../i18n'

import type {
  WifiNetwork,
  WifiKey,
  EapOption,
  WifiAuthField,
  WifiConfigureRequest,
  WifiSecurityType,
  WifiEapConfig,
  ConnectFormValues,
  ConnectFormErrors,
  ConnectFormField,
  ConnectFormTextField,
  ConnectFormSecurityField,
} from '../types'

type Errors = Record<string, FieldError>

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
  eapOptions: EapOption[],
  showAllOptions: boolean
): ConnectFormSecurityField => ({
  type: Constants.FIELD_TYPE_SECURITY,
  name: Constants.CONFIGURE_FIELD_SECURITY_TYPE,
  label: renderLabel(Copy.LABEL_SECURITY, true),
  placeholder: Copy.SELECT_AUTHENTICATION_METHOD,
  eapOptions,
  showAllOptions,
})

const getEapIsSelected = (formSecurityType?: string | null): boolean => {
  return (
    formSecurityType != null &&
    formSecurityType !== Constants.SECURITY_NONE &&
    formSecurityType !== Constants.SECURITY_WPA_PSK
  )
}

const getEapFields = (
  eapOptions: EapOption[],
  values: ConnectFormValues,
  errors?: ConnectFormErrors,
  touched?: boolean
): WifiAuthField[] => {
  const eapType = values.securityType
  return eapOptions
    .filter(opt => opt.name === eapType)
    .flatMap(opt => opt.options)
}

const getEapFieldName = (baseName: string): string => `eapConfig.${baseName}`

export function getConnectFormFields(
  network: WifiNetwork | null,
  robotName: string,
  eapOptions: EapOption[],
  wifiKeys: WifiKey[],
  values: ConnectFormValues
): ConnectFormField[] {
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
  eapOptions: EapOption[],
  values: ConnectFormValues,
  errors: Errors
): Errors {
  const {
    ssid: formSsid,
    securityType: formSecurityType,
    psk: formPsk,
  } = values
  let message: string | undefined

  if (network === null && !formSsid) {
    message = Copy.FIELD_IS_REQUIRED(Copy.LABEL_SSID)
    return message != null
      ? {
          ...errors,
          ssid: {
            type: 'ssidError',
            message: message,
          },
        }
      : errors
  }

  if (
    (network === null || network.securityType === Constants.SECURITY_WPA_EAP) &&
    !formSecurityType
  ) {
    message = Copy.FIELD_IS_REQUIRED(Copy.LABEL_SECURITY)
    return message != null
      ? {
          ...errors,
          securityType: {
            type: 'securityTypeError',
            message: message,
          },
        }
      : errors
  }

  if (
    (network?.securityType === Constants.SECURITY_WPA_PSK ||
      formSecurityType === Constants.SECURITY_WPA_PSK) &&
    (!formPsk || formPsk.length < Constants.CONFIGURE_PSK_MIN_LENGTH)
  ) {
    message = Copy.FIELD_NOT_LONG_ENOUGH(
      Copy.LABEL_PSK,
      Constants.CONFIGURE_PSK_MIN_LENGTH
    )
    return message != null
      ? {
          ...errors,
          psk: {
            type: 'pskError',
            message: message,
          },
        }
      : errors
  }

  if (
    network?.securityType === Constants.SECURITY_WPA_EAP ||
    getEapIsSelected(formSecurityType)
  ) {
    const eapFieldErrors = getEapFields(eapOptions, values)
      .filter(
        ({ name, required }) => required && !get(values, getEapFieldName(name))
      )
      .reduce(
        (
          acc: Errors,
          { name, displayName }: Pick<EapOption, 'name' | 'displayName'>
        ) => {
          const fieldName = getEapFieldName(name)
          const errorMessage =
            displayName != null ? Copy.FIELD_IS_REQUIRED(displayName) : ''

          if (errorMessage != null) {
            acc[fieldName] = {
              type: 'eapError',
              message: errorMessage,
            }
          }

          return acc
        },
        {}
      )

    return Object.keys(eapFieldErrors).length > 0
      ? {
          ...errors,
          ...eapFieldErrors,
        }
      : errors
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
    // @ts-expect-error TODO: formSecurityType could be undefined, but eapType expects string
    eapConfig = { eapType: formSecurityType }
  } else if (network != null) {
    securityType = network.securityType
  } else if (
    values.securityType === Constants.SECURITY_NONE ||
    values.securityType === Constants.SECURITY_WPA_PSK
  ) {
    securityType = values.securityType as WifiSecurityType
  }

  if (ssid !== null && securityType !== null) {
    const options: WifiConfigureRequest = {
      ssid,
      securityType,
      hidden: network === null,
    }

    if (formPsk != null) options.psk = formPsk
    if (eapConfig != null)
      options.eapConfig = { ...eapConfig, ...formEapConfig }
    return options
  }

  return null
}
