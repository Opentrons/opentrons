// @flow
import * as React from 'react'
import find from 'lodash/find'
import set from 'lodash/set'

import {
  NO_SECURITY,
  WPA_PSK_SECURITY,
  WPA_EAP_SECURITY,
  EAP_TYPE_FIELD,
} from '../../../http-api-client'
import SelectField from '../../SelectField'
import {FormTableRow} from './FormTable'
import styles from './styles.css'

import type {SelectOption} from '../../SelectField'
import type {
  WifiSecurityType,
  WifiEapOptionsList,
} from '../../../http-api-client'
import type {FormValues} from './ConnectForm'

type Props = {
  id: string,
  name: string,
  label: string,
  value: ?string,
  knownSecurityType: ?WifiSecurityType,
  touched: ?boolean,
  error: ?string,
  eapOptions: ?WifiEapOptionsList,
  setValues: (values: FormValues) => mixed,
  onLoseFocus: (name: string) => mixed,
}

const NO_SECURITY_LABEL = 'None'
const WPA_PSK_SECURITY_LABEL = 'WPA2 Personal'
const PLACEHOLDER = 'Select authentication method'

const BASE_SECURITY_OPTIONS: Array<SelectOption> = [
  {
    label: null,
    options: [{value: NO_SECURITY, label: NO_SECURITY_LABEL}],
  },
  {
    label: null,
    options: [{value: WPA_PSK_SECURITY, label: WPA_PSK_SECURITY_LABEL}],
  },
]

const eapOptToSelectOpt = o => ({
  label: o.displayName || o.name,
  value: o.name,
})

export default class SelectSecurity extends React.Component<Props> {
  handleValueChange = (name: string, value: string) => {
    const {knownSecurityType, eapOptions, setValues} = this.props
    const eapType = find(eapOptions, {name: value})
    const nextValues = {}

    if (eapType) {
      if (!knownSecurityType) set(nextValues, name, WPA_EAP_SECURITY)
      set(nextValues, EAP_TYPE_FIELD, value)
    } else {
      set(nextValues, name, value)
    }

    setValues(nextValues)
  }

  getOptions (): Array<SelectOption> {
    const {knownSecurityType, eapOptions} = this.props
    const options = knownSecurityType ? [] : [...BASE_SECURITY_OPTIONS]

    if (eapOptions && eapOptions.length) {
      options.push({
        label: null,
        options: eapOptions.map(eapOptToSelectOpt),
      })
    }

    return options
  }

  render () {
    const {
      id,
      name,
      label,
      value,
      touched,
      error,
      knownSecurityType,
      onLoseFocus,
    } = this.props

    if (
      knownSecurityType === NO_SECURITY ||
      knownSecurityType === WPA_PSK_SECURITY
    ) {
      return null
    }

    return (
      <FormTableRow label={label} labelFor={id}>
        <SelectField
          id={id}
          name={name}
          options={this.getOptions()}
          value={value}
          error={touched && error ? error : null}
          placeholder={PLACEHOLDER}
          onValueChange={this.handleValueChange}
          onLoseFocus={onLoseFocus}
          className={styles.select_security}
          menuPosition="fixed"
        />
      </FormTableRow>
    )
  }
}
