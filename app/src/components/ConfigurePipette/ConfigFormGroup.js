// @flow
import * as React from 'react'
import {Field} from 'formik'
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

export type FormValues = {[string]: ?string}

type FormGroupProps = {
  groupLabel: string,
  groupError?: ?string,
  formFields: Array<DisplayFieldProps>,
}

export default function ConfigFormGroup (props: FormGroupProps) {
  const {groupLabel, groupError, formFields} = props
  const formattedError =
    groupError &&
    groupError.split('\n').map(function (item, key) {
      return (
        <span key={key}>
          {item}
          <br />
        </span>
      )
    })
  return (
    <FormGroup label={groupLabel} className={styles.form_group}>
      {groupError && <p className={styles.group_error}>{formattedError}</p>}
      {formFields.map(f => {
        const _default = f.default.toString()
        const {name, displayName, units} = f
        return (
          <ConfigInput
            key={name}
            label={displayName}
            placeholder={_default}
            {...{name, units}}
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
  className?: string,
  placeholder: string,
  units: string,
}

export function ConfigInput (props: ConfigInputProps) {
  const {name, label, placeholder, units, className} = props
  const id = makeId(name)
  return (
    <ConfigFormRow label={label} labelFor={id}>
      <Field name={name}>
        {fieldProps => (
          <InputField
            {...{
              ...fieldProps.field,
              placeholder,
              units,
              className,
              error: fieldProps.form.errors[name],
              touched: fieldProps.form.touched[name],
            }}
          />
        )}
      </Field>
    </ConfigFormRow>
  )
}
