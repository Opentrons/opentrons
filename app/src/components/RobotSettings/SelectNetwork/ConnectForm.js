// @flow
import * as React from 'react'
import {Formik} from 'formik'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import find from 'lodash/find'
import map from 'lodash/map'
import set from 'lodash/set'

import {WPA_PSK_SECURITY, WPA_EAP_SECURITY} from '../../../http-api-client'

import {DropdownField} from '@opentrons/components'
import {BottomButtonBar} from '../../modals'
import ConnectFormField, {CONNECT_FIELD_ID_PREFIX} from './ConnectFormField'
import FormTable, {FormTableRow} from './FormTable'

import type {
  WifiSecurityType,
  WifiEapOptionsList,
  WifiKeysList,
  WifiAuthField,
  WifiConfigureRequest,
} from '../../../http-api-client'

type Props = {
  // TODO(mc, 2018-10-22): optional SSID
  ssid: string,
  securityType: WifiSecurityType,
  eapOptions: ?WifiEapOptionsList,
  keys: ?WifiKeysList,
  configure: WifiConfigureRequest => mixed,
  addKey: File => mixed,
  close: () => mixed,
}

type State = {|
  showPassword: {[name: string]: boolean},
|}

type FormValues = {[string]: ?(string | {[string]: string})}

const PSK_FIELD_NAME = 'psk'
const PSK_MIN_LENGTH = 8

const WPA_PSK_FIELDS = [
  {
    name: PSK_FIELD_NAME,
    displayName: 'Password',
    type: 'password',
    required: true,
  },
]

// all eap options go in a sub-object `eapConfig`
// eap method is stored under eapConfig.eapType
const EAP_FIELD_PREFIX = 'eapConfig.'
const EAP_METHOD_DISPLAY_NAME = 'Authentication'
const EAP_METHOD_FIELD = `${EAP_FIELD_PREFIX}eapType`
const EAP_METHOD_FIELD_ID = `${CONNECT_FIELD_ID_PREFIX}${EAP_METHOD_FIELD}`
const getEapMethod = (v: FormValues): ?string => get(v, EAP_METHOD_FIELD)

export default class ConnectForm extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {showPassword: {}}
  }

  onSubmit = (values: {[name: string]: string}) => {
    this.props.configure({
      ssid: this.props.ssid,
      securityType: this.props.securityType,
      hidden: !this.props.ssid,
      ...values,
    })

    this.props.close()
  }

  toggleShowPassword = (name: string) => {
    this.setState({
      showPassword: {
        ...this.state.showPassword,
        [name]: !this.state.showPassword[name],
      },
    })
  }

  getValidationSchema = (values: FormValues) => {
    const errors = this.getFields(values).reduce((errors, field) => {
      const {name, displayName, required} = field
      const value = get(values, name, '')

      if (required && !value) {
        set(errors, name, `${displayName} is required`)
      } else if (name === PSK_FIELD_NAME && value.length < PSK_MIN_LENGTH) {
        set(errors, name, `${displayName} must be at least 8 characters`)
      }

      return errors
    }, {})

    if (this.getSecurityType(values) === WPA_EAP_SECURITY) {
      if (!getEapMethod(values)) {
        set(errors, EAP_METHOD_FIELD, `${EAP_METHOD_DISPLAY_NAME} is required`)
      }
    }

    return errors
  }

  // TODO(mc, 2018-10-26): allow security type to be pulled from values
  // if not in props
  getSecurityType (values: FormValues): WifiSecurityType {
    return this.props.securityType
  }

  getFields (values: FormValues): Array<WifiAuthField> {
    const securityType = this.getSecurityType(values)

    if (securityType === WPA_PSK_SECURITY) return WPA_PSK_FIELDS
    if (securityType === WPA_EAP_SECURITY) {
      const method = find(this.props.eapOptions, {name: getEapMethod(values)})
      return get(method, 'options', []).map(field => ({
        ...field,
        name: `${EAP_FIELD_PREFIX}${field.name}`,
      }))
    }

    return []
  }

  render () {
    const {showPassword} = this.state
    const {securityType, keys, addKey, close} = this.props
    const eapOptions = map(this.props.eapOptions, o => ({
      name: o.displayName || o.name,
      value: o.name,
    }))

    return (
      <Formik
        onSubmit={this.onSubmit}
        validate={this.getValidationSchema}
        render={formProps => {
          const {
            values,
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            setFieldTouched,
            resetForm,
            errors,
            touched,
          } = formProps

          // disable submit if form is pristine or errors present
          const disabled = isEmpty(touched) || !isEmpty(errors)
          const fields = this.getFields(values)

          return (
            <form onSubmit={handleSubmit}>
              <FormTable>
                {securityType === WPA_EAP_SECURITY && (
                  <FormTableRow
                    label={`* ${EAP_METHOD_DISPLAY_NAME}:`}
                    labelFor={EAP_METHOD_FIELD_ID}
                  >
                    <DropdownField
                      id={EAP_METHOD_FIELD_ID}
                      name={EAP_METHOD_FIELD}
                      value={getEapMethod(values)}
                      options={eapOptions}
                      onChange={e => {
                        // reset all other fields on EAP type change
                        resetForm(set({}, EAP_METHOD_FIELD, e.target.value))
                      }}
                      onBlur={handleBlur}
                      error={
                        get(touched, EAP_METHOD_FIELD) &&
                        get(errors, EAP_METHOD_FIELD)
                      }
                    />
                  </FormTableRow>
                )}
                {fields.map(field => (
                  <ConnectFormField
                    key={field.name}
                    field={field}
                    value={get(values, field.name, '')}
                    keys={keys}
                    showPassword={!!showPassword[field.name]}
                    onChange={handleChange}
                    onValueChange={setFieldValue}
                    onBlur={handleBlur}
                    onLoseFocus={setFieldTouched}
                    addKey={addKey}
                    toggleShowPassword={this.toggleShowPassword}
                    error={get(errors, field.name)}
                    touched={get(touched, field.name)}
                  />
                ))}
              </FormTable>
              <BottomButtonBar
                buttons={[
                  {children: 'Cancel', onClick: close},
                  {children: 'Join', type: 'submit', disabled},
                ]}
              />
            </form>
          )
        }}
      />
    )
  }
}
