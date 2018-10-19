// @flow
import * as React from 'react'
import {Formik} from 'formik'

import {InputField, CheckboxField} from '@opentrons/components'
import {BottomButtonBar} from '../../modals'
import FormTable, {FormTableRow} from './FormTable'

import type {WifiConfigureRequest} from '../../../http-api-client'

// TODO(mc, 2018-10-18): add 802.1x fields
type AuthFieldName = 'psk'

type AuthField = {
  name: AuthFieldName,
  displayName: string,
  required: boolean,
  type: 'string' | 'file' | 'password',
}

type Props = {
  ssid: string,
  configure: WifiConfigureRequest => mixed,
  close: () => mixed,
  fields: Array<AuthField>,
}

type State = {|
  showPassword: {[name: AuthFieldName]: boolean},
|}

const FIELD_ID_PREFIX = '__ConnectForm__'

export class ConnectForm extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {showPassword: {}}
  }

  onSubmit = (values: {[name: AuthFieldName]: string}) => {
    this.props.configure({ssid: this.props.ssid, ...values})
    this.props.close()
  }

  toggleShowPassword = (name: AuthFieldName) => {
    this.setState({
      showPassword: {
        ...this.state.showPassword,
        [name]: !this.state.showPassword[name],
      },
    })
  }

  render () {
    const {showPassword} = this.state
    const {fields} = this.props

    // TODO(mc, 2018-10-18): form validation
    return (
      <Formik
        onSubmit={this.onSubmit}
        render={({handleChange, handleSubmit, values}) => (
          <form onSubmit={handleSubmit}>
            <FormTable>
              {fields.map(field => (
                <ConnectFormField
                  key={field.name}
                  field={field}
                  value={values[field.name] || ''}
                  showPassword={!!showPassword[field.name]}
                  onChange={handleChange}
                  toggleShowPassword={this.toggleShowPassword}
                />
              ))}
            </FormTable>
            <BottomButtonBar
              buttons={[
                {children: 'Cancel', onClick: this.props.close},
                {children: 'Join', type: 'submit'},
              ]}
            />
          </form>
        )}
      />
    )
  }
}

type ConnectFormFieldProps = {
  field: AuthField,
  value: string,
  showPassword: boolean,
  onChange: $PropertyType<React.ElementProps<typeof InputField>, 'onChange'>,
  toggleShowPassword: (name: AuthFieldName) => mixed,
}

function ConnectFormField (props: ConnectFormFieldProps) {
  const {value, showPassword, onChange, toggleShowPassword} = props
  const {name, displayName, type} = props.field
  const id = `${FIELD_ID_PREFIX}${name}`

  if (type === 'password') {
    return (
      <React.Fragment>
        <FormTableRow label={displayName} labelFor={id}>
          <InputField
            id={id}
            name={name}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={onChange}
          />
        </FormTableRow>
        <FormTableRow>
          <CheckboxField
            label="Show password"
            value={showPassword}
            onChange={() => toggleShowPassword(name)}
          />
        </FormTableRow>
      </React.Fragment>
    )
  }

  return null
}
