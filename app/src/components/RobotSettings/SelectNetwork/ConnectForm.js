// @flow
import * as React from 'react'
import {Formik} from 'formik'
import get from 'lodash/get'
import find from 'lodash/find'
import orderBy from 'lodash/orderBy'

import {WPA_PSK_SECURITY, WPA_EAP_SECURITY} from '../../../http-api-client'

import {DropdownField} from '@opentrons/components'
import {BottomButtonBar} from '../../modals'
import ConnectFormField, {CONNECT_FIELD_ID_PREFIX} from './ConnectFormField'
import FormTable, {FormTableRow} from './FormTable'

import type {
  WifiSecurityType,
  WifiEapOption,
  WifiAuthField,
  WifiConfigureRequest,
} from '../../../http-api-client'

type Props = {
  // TODO(mc, 2018-10-22): optional SSID
  ssid: string,
  securityType: WifiSecurityType,
  eapOptions: ?Array<WifiEapOption>,
  configure: WifiConfigureRequest => mixed,
  close: () => mixed,
}

type State = {|
  showPassword: {[name: string]: boolean},
|}

const WIFI_PSK_FIELDS = [
  {name: 'psk', displayName: 'Password', type: 'password', required: true},
]

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

  render () {
    const {showPassword} = this.state
    const {securityType, eapOptions} = this.props
    const eapMethodField = eapOptions ? 'eapConfig.eapType' : ''
    const eapMethodId = eapOptions
      ? `${CONNECT_FIELD_ID_PREFIX}${eapMethodField}`
      : ''

    // TODO(mc, 2018-10-18): form validation
    return (
      <Formik
        onSubmit={this.onSubmit}
        render={formProps => {
          const {handleReset, handleChange, handleSubmit, values} = formProps
          const eapMethod = get(values, eapMethodField)
          let fields: Array<WifiAuthField> = []

          if (securityType === WPA_PSK_SECURITY) {
            fields = WIFI_PSK_FIELDS
          } else if (securityType === WPA_EAP_SECURITY) {
            const selectedEapMethod = find(eapOptions, {name: eapMethod})
            fields = get(selectedEapMethod, 'options', []).map(field => ({
              ...field,
              name: `eapConfig.${field.name}`,
            }))
          }

          return (
            <form onSubmit={handleSubmit}>
              <FormTable>
                {securityType === WPA_EAP_SECURITY &&
                  eapOptions && (
                    <FormTableRow
                      label="* Authentication:"
                      labelFor={eapMethodId}
                    >
                      <DropdownField
                        id={eapMethodId}
                        name={eapMethodField}
                        value={eapMethod}
                        options={eapOptions.map(o => ({
                          name: o.displayName || o.name,
                          value: o.name,
                        }))}
                        onChange={e => {
                          handleReset()
                          handleChange(e)
                        }}
                      />
                    </FormTableRow>
                  )}
                {orderBy(fields, ['required'], ['desc']).map(field => (
                  <ConnectFormField
                    key={field.name}
                    field={field}
                    value={get(values, field.name, '')}
                    showPassword={!!showPassword[field.name]}
                    onChange={handleChange}
                    toggleShowPassword={this.toggleShowPassword}
                  />
                ))}
              </FormTable>
              <BottomButtonBar
                buttons={[
                  {children: 'Cancel', onClick: close},
                  {children: 'Join', type: 'submit'},
                ]}
              />
            </form>
          )
        }}
      />
    )
  }
}
