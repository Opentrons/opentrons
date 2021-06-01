import * as React from 'react'
import { Field } from 'formik'
import { FormGroup, InputField, CheckboxField } from '@opentrons/components'

import styles from './styles.css'

import type { FieldProps } from 'formik'
import type { DisplayFieldProps, DisplayQuirkFieldProps } from './ConfigForm'

export interface FormColumnProps {
  children: React.ReactNode
}

export function FormColumn(props: FormColumnProps): JSX.Element {
  return <div className={styles.form_column}>{props.children}</div>
}

export interface FormValues {
  [key: string]: (string | boolean) | null | undefined
}

export interface ConfigFormGroupProps {
  groupLabel: string
  groupError?: string | null | undefined
  formFields: DisplayFieldProps[]
}

export function ConfigFormGroup(props: ConfigFormGroupProps): JSX.Element {
  const { groupLabel, groupError, formFields } = props
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
      {formFields.map((field, index) => {
        return <ConfigInput field={field} key={index} />
      })}
    </FormGroup>
  )
}

export interface ConfigFormRowProps {
  label: string
  labelFor: string
  children: React.ReactNode
}

const FIELD_ID_PREFIX = '__PipetteConfig__'
const makeId = (name: string): string => `${FIELD_ID_PREFIX}.${name}`

export function ConfigFormRow(props: ConfigFormRowProps): JSX.Element {
  const { labelFor, label } = props
  return (
    <div className={styles.form_row}>
      {/* @ts-expect-error TODO: this label element's label prop doesn't do anything, remove it */}
      <label label={label} htmlFor={labelFor} className={styles.form_label}>
        {props.label}
      </label>
      <div className={styles.form_input}>{props.children}</div>
    </div>
  )
}

export interface ConfigInputProps {
  field: DisplayFieldProps
  className?: string
}

export function ConfigInput(props: ConfigInputProps): JSX.Element {
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
            // @ts-expect-error TODO: this error prop can't handle some formik error array types
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

export interface ConfigCheckboxProps {
  field: DisplayQuirkFieldProps
  className?: string
}

export function ConfigCheckbox(props: ConfigCheckboxProps): JSX.Element {
  const { field, className } = props
  const { name, displayName } = field
  const id = makeId(name)
  return (
    <ConfigFormRow label={displayName} labelFor={id}>
      <Field name={name} type="checkbox">
        {(fieldProps: FieldProps) => (
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

export interface ConfigQuirkGroupProps {
  groupLabel: string
  quirks: DisplayQuirkFieldProps[]
}

export function ConfigQuirkGroup(props: ConfigQuirkGroupProps): JSX.Element {
  const { groupLabel, quirks } = props
  return (
    <FormGroup label={groupLabel} className={styles.form_group}>
      {quirks.map((field, index) => {
        return <ConfigCheckbox field={field} key={index} />
      })}
    </FormGroup>
  )
}
