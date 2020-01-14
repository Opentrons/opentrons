// @flow
import * as React from 'react'

import {
  InputField,
  CheckboxField,
  SelectField,
  type SelectOption,
} from '@opentrons/components'
import { FormTableRow } from './FormTable'
import styles from './styles.css'

type BaseFieldProps = {|
  name: string,
  label: string,
  value: ?string,
  error: ?string,
  required: boolean,
  className?: string,
|}

type StringFieldProps = {
  ...BaseFieldProps,
  onChange: (event: *) => mixed,
  onBlur: (event: *) => mixed,
}

type PasswordFieldProps = {
  ...$Exact<StringFieldProps>,
  showPassword: ?boolean,
  toggleShowPassword: (name: string) => mixed,
}

type SelectOptionFieldProps = {|
  ...BaseFieldProps,
  options: Array<SelectOption>,
  placeholder?: string,
  onValueChange: (name: string, value: ?string) => mixed,
  onLoseFocus?: (name: string) => mixed,
|}

const SHOW_PASSWORD_LABEL = 'Show password'
const FIELD_ID_PREFIX = '__ConnectForm__'
const makeId = (name: *): string => `${FIELD_ID_PREFIX}.${name}`
const makeLabel = (lab: *, req: *): string => (req ? `* ${lab}:` : `${lab}:`)

export function StringField(props: StringFieldProps) {
  const { name, value, error, className, onChange, onBlur } = props
  const id = makeId(name)
  const label = makeLabel(props.label, props.required)
  const type = 'text'

  return (
    <FormTableRow label={label} labelFor={id}>
      <InputField
        {...{ id, name, type, value, error, className, onChange, onBlur }}
      />
    </FormTableRow>
  )
}

export function PasswordField(props: PasswordFieldProps) {
  const { name, value, error, className, onChange, onBlur } = props
  const id = makeId(name)
  const label = makeLabel(props.label, props.required)
  const showPassword = !!props.showPassword
  const type = showPassword ? 'text' : 'password'
  const toggleShow = () => props.toggleShowPassword(name)

  return (
    <React.Fragment>
      <FormTableRow label={label} labelFor={id}>
        <InputField
          {...{ id, name, type, value, error, className, onChange, onBlur }}
        />
      </FormTableRow>
      <FormTableRow>
        <CheckboxField
          label={SHOW_PASSWORD_LABEL}
          value={showPassword}
          onChange={toggleShow}
        />
      </FormTableRow>
    </React.Fragment>
  )
}

export function SelectOptionField(props: SelectOptionFieldProps) {
  const { name } = props
  const id = makeId(name)
  const label = makeLabel(props.label, props.required)

  return (
    <FormTableRow label={label} labelFor={id}>
      <SelectField
        {...{
          id,
          name,
          value: props.value,
          options: props.options,
          error: props.error,
          placeholder: props.placeholder,
          className: props.className,
          onValueChange: props.onValueChange,
          onLoseFocus: props.onLoseFocus,
        }}
        menuPosition="fixed"
        className={styles.form_field_select}
      />
    </FormTableRow>
  )
}
