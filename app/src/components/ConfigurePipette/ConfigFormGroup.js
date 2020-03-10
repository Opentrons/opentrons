// @flow
import * as React from 'react'
import { Field, type FieldProps } from 'formik'
import { FormGroup, InputField, CheckboxField } from '@opentrons/components'

import styles from './styles.css'

import type { DisplayFieldProps, DisplayQuirkFieldProps } from './ConfigForm'

export type FormColumnProps = {|
  children: React.Node,
|}

export function FormColumn(props: FormColumnProps) {
  return <div className={styles.form_column}>{props.children}</div>
}

export type FormValues = { [string]: ?(string | boolean) }

export type ConfigFormGroupProps = {|
  groupLabel: string,
  groupError?: ?string,
  formFields: Array<DisplayFieldProps>,
|}

export function ConfigFormGroup(props: ConfigFormGroupProps) {
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

export type ConfigFormRowProps = {|
  label: string,
  labelFor: string,
  children: React.Node,
|}

const FIELD_ID_PREFIX = '__PipetteConfig__'
const makeId = (name: *): string => `${FIELD_ID_PREFIX}.${name}`

export function ConfigFormRow(props: ConfigFormRowProps) {
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

export type ConfigInputProps = {|
  field: DisplayFieldProps,
  className?: string,
|}

export function ConfigInput(props: ConfigInputProps) {
  const { field, className } = props
  const { name, units, displayName } = field
  const id = makeId(field.name)
  const _default = field.default.toString()
  return (
    <ConfigFormRow label={displayName} labelFor={id}>
      <Field name={name}>
        {(fieldProps: FieldProps<DisplayFieldProps>) => (
          <InputField
            placeholder={_default}
            name={fieldProps.field.name}
            value={String(fieldProps.field.value ?? '')}
            onChange={fieldProps.field.onChange}
            onBlur={fieldProps.field.onBlur}
            error={fieldProps.form.errors[name]}
            {...{
              units,
              className,
            }}
          />
        )}
      </Field>
    </ConfigFormRow>
  )
}

export type ConfigCheckboxProps = {|
  field: DisplayQuirkFieldProps,
  className?: string,
|}

export function ConfigCheckbox(props: ConfigCheckboxProps) {
  const { field, className } = props
  const { name, displayName } = field
  const id = makeId(name)
  return (
    <ConfigFormRow label={displayName} labelFor={id}>
      <Field name={name} type="checkbox">
        {fieldProps => (
          <CheckboxField
            name={fieldProps.field.name}
            onChange={fieldProps.field.onChange}
            value={fieldProps.field.checked}
            className={className}
          />
        )}
      </Field>
    </ConfigFormRow>
  )
}

export type ConfigQuirkGroupProps = {|
  groupLabel: string,
  quirks: Array<DisplayQuirkFieldProps>,
|}

export function ConfigQuirkGroup(props: ConfigQuirkGroupProps) {
  const { groupLabel, quirks } = props
  return (
    <FormGroup label={groupLabel} className={styles.form_group}>
      {quirks.map((field, index) => {
        return <ConfigCheckbox field={field} key={index} />
      })}
    </FormGroup>
  )
}
