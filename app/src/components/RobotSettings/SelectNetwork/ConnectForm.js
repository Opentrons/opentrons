// @flow
import * as React from 'react'
import {Formik} from 'formik'
import get from 'lodash/get'
import find from 'lodash/find'
import set from 'lodash/set'

import {
  NO_SECURITY,
  WPA_PSK_SECURITY,
  WPA_EAP_SECURITY,
  SECURITY_TYPE_FIELD,
  EAP_CONFIG_FIELD,
  EAP_TYPE_FIELD,
} from '../../../http-api-client'

import {BottomButtonBar} from '../../modals'
import ConnectFormField, {CONNECT_FIELD_ID_PREFIX} from './ConnectFormField'
import SelectSecurity from './SelectSecurity'
import FormTable from './FormTable'

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
  securityType: ?WifiSecurityType,
  eapOptions: ?WifiEapOptionsList,
  keys: ?WifiKeysList,
  configure: WifiConfigureRequest => mixed,
  addKey: File => mixed,
  close: () => mixed,
}

type State = {|
  showPassword: {[name: string]: boolean},
|}

export type FormValues = {[string]: ?(string | {[string]: string})}

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
const SECURITY_TYPE_LABEL = 'Authentication'
const SECURITY_TYPE_ID = `${CONNECT_FIELD_ID_PREFIX}${SECURITY_TYPE_FIELD}`
const getEapType = (v: FormValues): ?string => get(v, EAP_TYPE_FIELD)

export default class ConnectForm extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {showPassword: {}}
  }

  onSubmit = (values: FormValues) => {
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
    const securityType = this.getSecurityType(values)

    if (securityType === NO_SECURITY) return {}

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

    if (
      !securityType ||
      (securityType === WPA_EAP_SECURITY && !getEapType(values))
    ) {
      set(errors, SECURITY_TYPE_FIELD, `${SECURITY_TYPE_LABEL} is required`)
    }

    return errors
  }

  getSecurityType (values: FormValues): ?WifiSecurityType {
    const formSecurityType: ?WifiSecurityType = (values.securityType: any)
    return this.props.securityType || formSecurityType
  }

  getFields (values: FormValues): Array<WifiAuthField> {
    const securityType = this.getSecurityType(values)

    if (securityType === WPA_PSK_SECURITY) return WPA_PSK_FIELDS
    if (securityType === WPA_EAP_SECURITY) {
      const method = find(this.props.eapOptions, {name: getEapType(values)})
      return get(method, 'options', []).map(field => ({
        ...field,
        name: `${EAP_CONFIG_FIELD}.${field.name}`,
      }))
    }

    return []
  }

  render () {
    const {showPassword} = this.state
    const {keys, addKey, close, securityType: knownSecurityType} = this.props

    return (
      <Formik
        onSubmit={this.onSubmit}
        validate={this.getValidationSchema}
        render={formProps => {
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
                <SelectSecurity
                  id={SECURITY_TYPE_ID}
                  name={SECURITY_TYPE_FIELD}
                  label={`* ${SECURITY_TYPE_LABEL}:`}
                  value={getEapType(values) || this.getSecurityType(values)}
                  knownSecurityType={knownSecurityType}
                  touched={get(touched, SECURITY_TYPE_FIELD)}
                  error={get(errors, SECURITY_TYPE_FIELD)}
                  eapOptions={this.props.eapOptions}
                  setValues={nextValues => {
                    if (nextValues.securityType === NO_SECURITY) {
                      setValues(nextValues)
                    } else {
                      resetForm(nextValues)
                    }
                  }}
                  onLoseFocus={setFieldTouched}
                />
                {this.getFields(values).map(field => (
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
                  {children: 'Join', type: 'submit', disabled: !isValid},
                ]}
              />
            </form>
          )
        }}
      />
    )
  }
}
