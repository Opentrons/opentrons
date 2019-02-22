// @flow
import * as React from 'react'
import {FormGroup, InputField} from '@opentrons/components'

import styles from './styles.css'

import type {DisplayFieldProps} from './ConfigForm'

type FormColProps = {
  children: React.Node,
  className?: string,
}

export function FormColumn (props: FormColProps) {
  return <div className={styles.form_column}>{props.children}</div>
}

type FormValues = {[string]: ?string}

type FormGroupProps = {
  groupLabel: string,
  values: FormValues,
  formFields: Array<DisplayFieldProps>,
  onChange: (event: *) => mixed,
  error: ?string,
}

function getFieldValue (name: string, values: FormValues): ?string {
  return values[name]
}

export default function ConfigFormGroup (props: FormGroupProps) {
  const {groupLabel, values, formFields, onChange, error} = props
  return (
    <FormGroup label={groupLabel} className={styles.form_group}>
      {formFields.map(f => {
        const value = getFieldValue(f.name, values)
        const _default = f.default.toString()
        const {name, displayName, units, min, max} = f
        return (
          <ConfigInput
            key={name}
            label={displayName}
            placeholder={_default}
            {...{name, units, value, min, max, onChange, error}}
          />
        )
      })}
    </FormGroup>
  )
}

type FormRowProps = {
  label: string,
  labelFor: string,
  children: React.Node,
}

const FIELD_ID_PREFIX = '__PipetteConfig__'
const makeId = (name: *): string => `${FIELD_ID_PREFIX}.${name}`

export function ConfigFormRow (props: FormRowProps) {
  const {labelFor, label} = props
  return (
    <div className={styles.form_row}>
      <label label={label} htmlFor={labelFor} className={styles.form_label}>
        {props.label}
      </label>
      <div className={styles.form_input}>{props.children}</div>
    </div>
  )
}

type ConfigInputProps = {
  name: string,
  label: string,
  value: ?string,
  error: ?string,
  className?: string,
  placeholder: string,
  units: string,
  onChange: (event: *) => mixed,
}

export function ConfigInput (props: ConfigInputProps) {
  const {
    name,
    label,
    value,
    placeholder,
    units,
    error,
    className,
    onChange,
  } = props
  const id = makeId(name)
  return (
    <ConfigFormRow label={label} labelFor={id}>
      <InputField
        {...{
          id,
          name,
          value,
          placeholder,
          units,
          error,
          className,
          onChange,
        }}
      />
    </ConfigFormRow>
  )
}
