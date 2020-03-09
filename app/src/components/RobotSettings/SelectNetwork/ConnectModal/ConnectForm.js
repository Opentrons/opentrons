// @flow
import * as React from 'react'
import { Formik, Form } from 'formik'
import get from 'lodash/get'

import styles from './ConnectForm.css'

import {
  AUTH_TYPE_PASSWORD,
  AUTH_TYPE_FILE,
  AUTH_TYPE_SECURITY_INTERNAL,
  PLACEHOLDER_SELECT_SECURITY,
  PLACEHOLDER_SELECT_FILE,
} from './constants'

import {
  getConnectFormFields,
  validateConnectFormFields,
  connectFormToConfigureRequest,
} from './form-fields'

import { StringField } from './StringField'
import { SelectSecurity } from './SelectSecurity'
import { SelectKey } from './SelectKey'

import type {
  WifiConfigureRequest,
  WifiNetwork,
  WifiKey,
  EapOption,
} from '../types'

import type {
  ConnectFormValues,
  ConnectFormErrors,
  ConnectFormTouched,
} from './types'

export type ConnectFormProps = {|
  id: string,
  robotName: string,
  network: WifiNetwork | null,
  wifiKeys: Array<WifiKey>,
  eapOptions: Array<EapOption>,
  onConnect: WifiConfigureRequest => mixed,
  onCancel: () => mixed,
|}

type FormikBag = {
  values: ConnectFormValues,
  errors: ConnectFormErrors,
  touched: ConnectFormTouched,
  handleChange: (e: SyntheticInputEvent<HTMLElement>) => mixed,
  handleBlur: (e: SyntheticFocusEvent<HTMLElement>) => mixed,
  setFieldValue: (name: string, value: mixed) => mixed,
  setFieldTouched: (name: string, value: mixed) => mixed,
  resetForm: (values: ConnectFormValues) => mixed,
  ...
}

export const ConnectForm = (props: ConnectFormProps) => {
  const { id, robotName, network, eapOptions, wifiKeys, onConnect } = props

  const handleSubmit = (values: ConnectFormValues) => {
    const request = connectFormToConfigureRequest(network, values)
    if (request) onConnect(request)
  }

  const handleValidate = (values: ConnectFormValues) => {
    return validateConnectFormFields(network, eapOptions, values)
  }

  return (
    <Formik onSubmit={handleSubmit} validate={handleValidate}>
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        setFieldValue,
        setFieldTouched,
        resetForm,
      }: FormikBag) => (
        <Form id={id} className={styles.form_table}>
          {getConnectFormFields(network, eapOptions, values).map(field => {
            const { type, name, required, label } = field
            const fieldTouched = get(touched, name, false)
            const value = get(values, name, null)
            const fieldProps = {
              name,
              id: `${id}__${name}`,
              className: styles.form_field,
              label: `${required ? '* ' : ''}${label}`,
              error: fieldTouched ? get(errors, name, null) : null,
            }

            const handleSecurityChange = ({ securityType, eapConfig }) => {
              const next: ConnectFormValues = {}
              if (eapConfig) next.eapConfig = eapConfig
              if (network === null) {
                next.ssid = values.ssid
                next.securityType = securityType
              }
              resetForm(next)
            }

            if (type === AUTH_TYPE_SECURITY_INTERNAL) {
              return (
                <SelectSecurity
                  key={name}
                  {...{
                    ...fieldProps,
                    values,
                    eapOptions,
                    showAll: network === null,
                    placeholder: PLACEHOLDER_SELECT_SECURITY,
                    onLoseFocus: setFieldTouched,
                    onSecurityChange: handleSecurityChange,
                  }}
                />
              )
            }

            if (type === AUTH_TYPE_FILE) {
              return (
                <SelectKey
                  key={name}
                  {...{
                    ...fieldProps,
                    value,
                    wifiKeys,
                    robotName,
                    placeholder: PLACEHOLDER_SELECT_FILE,
                    onValueChange: setFieldValue,
                    onLoseFocus: setFieldTouched,
                  }}
                />
              )
            }

            return (
              <StringField
                key={name}
                {...{
                  ...fieldProps,
                  value,
                  onChange: handleChange,
                  onBlur: handleBlur,
                  isPassword: type === AUTH_TYPE_PASSWORD,
                }}
              />
            )
          })}
        </Form>
      )}
    </Formik>
  )
}
