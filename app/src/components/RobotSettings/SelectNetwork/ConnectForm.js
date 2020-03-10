// @flow
import * as React from 'react'
import { Formik } from 'formik'
import get from 'lodash/get'
import find from 'lodash/find'
import set from 'lodash/set'

import {
  NO_SECURITY,
  WPA_PSK_SECURITY,
  WPA_EAP_SECURITY,
  SSID_FIELD,
  PSK_FIELD,
  SECURITY_TYPE_FIELD,
  EAP_CONFIG_FIELD,
  EAP_TYPE_FIELD,
} from '../../../http-api-client'

import { BottomButtonBar } from '../../modals'
import { StringField, PasswordField, SelectOptionField } from './fields'
import { SelectKey } from './SelectKey'
import { FormTable } from './FormTable'

import type {
  WifiSecurityType,
  WifiEapOptionsList,
  WifiEapOption,
  WifiAuthField,
  WifiKeysList,
  WifiConfigureRequest,
} from '../../../http-api-client'

import type { SelectOptionOrGroup } from '@opentrons/components'
import type { FormikProps, FormikState } from 'formik/@flow-typed'

type ConnectFormProps = {|
  ssid: ?string,
  securityType: ?WifiSecurityType,
  eapOptions: ?WifiEapOptionsList,
  keys: ?WifiKeysList,
  configure: WifiConfigureRequest => mixed,
  addKey: File => mixed,
  close: () => mixed,
|}

type ConnectFormState = {|
  showPassword: { [name: string]: boolean },
|}

type FieldProps = {
  type: 'string' | 'password' | 'security' | 'file',
  name: string,
  label: string,
  required: boolean,
}

export type FormValues = { [string]: ?(string | { [string]: string }) }

const PSK_MIN_LENGTH = 8

// TODO(mc, 2018-10-31): i18n
const SSID_LABEL = 'Network Name (SSID)'
const PSK_LABEL = 'Password'
const SECURITY_TYPE_LABEL = 'Authentication'
const SECURITY_TYPE_PLACEHOLDER = 'Select authentication method'
const NO_SECURITY_LABEL = 'None'
const PSK_SECURITY_LABEL = 'WPA2 Personal'

const UNKNOWN_SSID_FIELD_PROPS: FieldProps = {
  type: 'string',
  name: SSID_FIELD,
  label: SSID_LABEL,
  required: true,
}

const PSK_FIELD_PROPS: FieldProps = {
  type: 'password',
  name: PSK_FIELD,
  label: PSK_LABEL,
  required: true,
}

const SECURITY_TYPE_FIELD_PROPS: FieldProps = {
  type: 'security',
  name: SECURITY_TYPE_FIELD,
  label: SECURITY_TYPE_LABEL,
  required: true,
}

const UNKNOWN_SECURITY_OPTIONS: Array<SelectOptionOrGroup> = [
  {
    options: [{ value: NO_SECURITY, label: NO_SECURITY_LABEL }],
  },
  {
    options: [{ value: WPA_PSK_SECURITY, label: PSK_SECURITY_LABEL }],
  },
]

const getEapType = (v: FormValues): ?string => get(v, EAP_TYPE_FIELD)

const makeEapOpt = (opt: WifiEapOption) => ({
  label: opt.displayName || opt.name,
  value: opt.name,
})

const makeEapField = (opt: WifiAuthField) => ({
  type: opt.type,
  name: `${EAP_CONFIG_FIELD}.${opt.name}`,
  label: opt.displayName,
  required: opt.required,
})

const getEapFields = (
  eapOptions: ?WifiEapOptionsList,
  name: ?string
): Array<FieldProps> => {
  const method = find(eapOptions, { name })
  const options = method ? method.options : []
  return options.map(makeEapField)
}

export class ConnectForm extends React.Component<
  ConnectFormProps,
  ConnectFormState
> {
  constructor(props: ConnectFormProps) {
    super(props)
    this.state = { showPassword: {} }
  }

  handleSubmit = (values: FormValues) => {
    const { ssid: knownSsid, configure, close } = this.props
    const ssid = this.getSsid(values)
    const securityType = this.getSecurityType(values)
    const hidden = !knownSsid

    // TODO(mc, 2020-02-21): This configure form needs to be redone as part
    // of the configure endpoint client-side refactor
    // $FlowFixMe(mc, 2020-02-21): Error from Flow 0.118 upgrade
    configure({ ...values, ssid, securityType, hidden })
    close()
  }

  toggleShowPassword = (name: string) => {
    this.setState({
      // note: this will store paths as a flat object (e.g. {'foo.bar': true})
      showPassword: {
        ...this.state.showPassword,
        [name]: !this.state.showPassword[name],
      },
    })
  }

  validate = (values: FormValues) => {
    const { securityType: knownSecurityType } = this.props

    return this.getFields(values).reduce((errors, field) => {
      const { name, label, required } = field
      let missingEap = false
      let value: string

      if (name === SSID_FIELD) {
        value = this.getSsid(values) || ''
      } else if (name === SECURITY_TYPE_FIELD) {
        value = this.getSecurityType(values) || ''
        missingEap =
          knownSecurityType === WPA_EAP_SECURITY && !get(values, EAP_TYPE_FIELD)
      } else {
        value = get(values, name, '')
      }

      if ((required && !value) || missingEap) {
        set(errors, name, `${label} is required`)
      } else if (name === PSK_FIELD && value.length < PSK_MIN_LENGTH) {
        set(errors, name, `${label} must be at least 8 characters`)
      }

      return errors
    }, {})
  }

  getSsid(values: FormValues): ?string {
    return this.props.ssid || get(values, SSID_FIELD)
  }

  getSecurityType(values: FormValues): ?WifiSecurityType {
    return this.props.securityType || get(values, SECURITY_TYPE_FIELD)
  }

  getSecurityOptions(): Array<SelectOptionOrGroup> {
    const { eapOptions, securityType: knownSecurityType } = this.props
    const opts = !knownSecurityType ? UNKNOWN_SECURITY_OPTIONS : []

    return eapOptions && eapOptions.length
      ? opts.concat({ options: eapOptions.map(makeEapOpt) })
      : opts
  }

  getFields(values: FormValues): Array<FieldProps> {
    const { ssid: knownSsid, securityType: knownSecurityType } = this.props
    const securityType = this.getSecurityType(values)
    const fields = []

    if (!knownSsid) fields.push(UNKNOWN_SSID_FIELD_PROPS)

    if (!knownSecurityType || knownSecurityType === WPA_EAP_SECURITY) {
      fields.push(SECURITY_TYPE_FIELD_PROPS)
    }

    if (securityType === WPA_PSK_SECURITY) {
      fields.push(PSK_FIELD_PROPS)
    } else if (securityType === WPA_EAP_SECURITY) {
      fields.push(...getEapFields(this.props.eapOptions, getEapType(values)))
    }

    return fields
  }

  getFieldValue(name: string, values: FormValues): ?string {
    if (name === SECURITY_TYPE_FIELD) {
      return getEapType(values) || this.getSecurityType(values)
    }

    return get(values, name)
  }

  handleSecurityChange(args: {|
    name: string,
    value: ?string,
    ssid: ?string,
    setValues: (values: FormValues) => void,
    resetForm: (nextState?: $Shape<FormikState<FormValues>>) => void,
  |}): mixed {
    const { name, value, ssid, setValues, resetForm } = args
    const { eapOptions, securityType: knownSecurityType } = this.props
    const nextValues = ssid ? { ssid } : {}
    const eapType = find(eapOptions, { name: value })
    const securityValue = eapType ? WPA_EAP_SECURITY : value

    if (!knownSecurityType) set(nextValues, name, securityValue)
    if (eapType) set(nextValues, EAP_TYPE_FIELD, value)
    // resetting the form on NO_SECURITY clears
    // validation, disabling submit, so use setValues
    if (value === NO_SECURITY) {
      setValues(nextValues)
    } else {
      resetForm({ values: nextValues })
    }
  }

  render() {
    const { showPassword } = this.state
    const { keys, addKey, close } = this.props

    return (
      <Formik
        onSubmit={this.handleSubmit}
        validate={this.validate}
        initialValues={{}}
      >
        {(formProps: FormikProps<FormValues>) => {
          const {
            values,
            errors,
            touched,
            isValid,
            handleChange,
            setFieldValue,
            handleBlur,
            setFieldTouched,
            resetForm,
            setValues,
            handleSubmit,
          } = formProps

          return (
            <form onSubmit={handleSubmit}>
              <FormTable>
                {this.getFields(values).map(field => {
                  const { type, name, label, required } = field
                  const value = this.getFieldValue(field.name, values)
                  const error = get(touched, name) ? get(errors, name) : null

                  if (type === 'string') {
                    return (
                      <StringField
                        key={name}
                        {...{ name, label, value, error, required }}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    )
                  }
                  if (type === 'password') {
                    return (
                      <PasswordField
                        key={name}
                        {...{ name, label, value, error, required }}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        showPassword={showPassword[name]}
                        toggleShowPassword={this.toggleShowPassword}
                      />
                    )
                  }
                  if (type === 'security') {
                    return (
                      <SelectOptionField
                        key={name}
                        {...{ name, label, value, error, required }}
                        options={this.getSecurityOptions()}
                        placeholder={SECURITY_TYPE_PLACEHOLDER}
                        onLoseFocus={setFieldTouched}
                        onValueChange={(name, value) => {
                          this.handleSecurityChange({
                            name,
                            value,
                            // needed to ensure SSID is not wiped out
                            ssid: this.getSsid(values),
                            setValues,
                            resetForm,
                          })
                        }}
                      />
                    )
                  }
                  if (type === 'file') {
                    return (
                      <SelectKey
                        key={name}
                        {...{
                          name,
                          label,
                          value,
                          error,
                          required,
                          keys,
                          addKey,
                        }}
                        onValueChange={setFieldValue}
                        onLoseFocus={setFieldTouched}
                      />
                    )
                  }

                  return null
                })}
              </FormTable>
              <BottomButtonBar
                buttons={[
                  { children: 'Cancel', onClick: close },
                  { children: 'Join', type: 'submit', disabled: !isValid },
                ]}
              />
            </form>
          )
        }}
      </Formik>
    )
  }
}
