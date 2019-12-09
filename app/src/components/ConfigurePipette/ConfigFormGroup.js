// @flow
import * as React from 'react'
import { Field } from 'formik'
import { FormGroup, InputField, CheckboxField } from '@opentrons/components'

import styles from './styles.css'

import type { DisplayFieldProps, DisplayQuirkFieldProps } from './ConfigForm'

type FormColProps = {
  children: React.Node,
  className?: string,
}

export function FormColumn(props: FormColProps) {
  return <div className={styles.form_column}>{props.children}</div>
}

export type FormValues = { [string]: ?(string | boolean) }

type FormGroupProps = {
  groupLabel: string,
  groupError?: ?string,
  formFields: Array<DisplayFieldProps>,
}

export default function ConfigFormGroup(props: FormGroupProps) {
  const { groupLabel, groupError, formFields } = props
  const formattedError =
    groupError &&
    groupError.split('\n').map(function(item, key) {
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
      {formFields.map((field, index) => {
        return <ConfigInput field={field} key={index} />
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

export function ConfigFormRow(props: FormRowProps) {
  const { labelFor, label } = props
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
  field: DisplayFieldProps,
  className?: string,
}

export function ConfigInput(props: ConfigInputProps) {
  const { field, className } = props
  const { name, units, displayName } = field
  const id = makeId(field.name)
  const _default = field.default.toString()
  return (
    <ConfigFormRow label={displayName} labelFor={id}>
      <Field name={name}>
        {fieldProps => (
          <InputField
            placeholder={_default}
            {...{
              ...fieldProps.field,
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

type ConfigBooleanProps = {
  field: DisplayQuirkFieldProps,
  className?: string,
}

export function ConfigCheckbox(props: ConfigBooleanProps) {
  const { field, className } = props
  const { name, displayName } = field
  const id = makeId(name)
  return (
    <ConfigFormRow label={displayName} labelFor={id}>
      <Field name={name}>
        {fieldProps => (
          <CheckboxField
            {...{
              ...fieldProps.field,
              className,
            }}
          />
        )}
      </Field>
    </ConfigFormRow>
  )
}

type QuirkGroupProps = {
  groupLabel: string,
  quirks: Array<DisplayQuirkFieldProps>,
}

export function ConfigQuirkGroup(props: QuirkGroupProps) {
  const { groupLabel, quirks } = props
  return (
    <FormGroup label={groupLabel} className={styles.form_group}>
      {quirks.map((field, index) => {
        return <ConfigCheckbox field={field} key={index} />
      })}
    </FormGroup>
  )
}
