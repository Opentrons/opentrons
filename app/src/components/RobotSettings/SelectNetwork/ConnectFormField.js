// @flow
import * as React from 'react'
import {InputField, CheckboxField} from '@opentrons/components'
import SelectKey from './SelectKey'
import {FormTableRow} from './FormTable'

import type {WifiAuthField, WifiKeysList} from '../../../http-api-client'

type Props = {
  field: WifiAuthField,
  value: string,
  touched: ?boolean,
  error: ?string,
  onChange: (*) => mixed,
  onBlur: (SyntheticFocusEvent<*>) => mixed,
  onValueChange: (name: string, value: *) => mixed,
  onLoseFocus: (name: string) => mixed,
  showPassword: boolean,
  toggleShowPassword: (name: string) => mixed,
  keys: ?WifiKeysList,
  addKey: File => mixed,
}

export const CONNECT_FIELD_ID_PREFIX = '__ConnectForm__'

export default function ConnectFormField (props: Props) {
  const {
    value,
    onChange,
    onValueChange,
    onBlur,
    onLoseFocus,
    showPassword,
    toggleShowPassword,
    keys,
    addKey,
  } = props
  const {name, displayName, type, required} = props.field
  const error = props.touched ? props.error : null
  const id = `${CONNECT_FIELD_ID_PREFIX}${name}`
  const label = required ? `* ${displayName}:` : `${displayName}:`
  let input = null

  if (type === 'string' || type === 'password') {
    const inputType = type === 'string' || showPassword ? 'text' : 'password'
    input = (
      <InputField
        id={id}
        name={name}
        type={inputType}
        value={value}
        onChange={onChange}
        error={error}
        onBlur={onBlur}
      />
    )
  } else if (type === 'file') {
    input = (
      <SelectKey
        id={id}
        name={name}
        value={value}
        error={error}
        keys={keys}
        addKey={addKey}
        onValueChange={onValueChange}
        onLoseFocus={onLoseFocus}
      />
    )
  }

  const inputRow = (
    <FormTableRow label={label} labelFor={id}>
      {input}
    </FormTableRow>
  )

  // render "showPassword" checkbox if type === 'password'
  if (type === 'password') {
    return (
      <React.Fragment>
        {inputRow}
        <FormTableRow>
          <CheckboxField
            name="Show password"
            label="Show password"
            value={showPassword}
            onChange={() => toggleShowPassword(name)}
          />
        </FormTableRow>
      </React.Fragment>
    )
  }

  return inputRow
}
