import * as React from 'react'
import { Field } from 'formik'
import {
  FormGroup,
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  CheckboxField,
} from '@opentrons/components'
import { InputField } from '../../atoms/InputField'
import { StyledText } from '../../atoms/text'
import styles from './styles.module.css'

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
    <FormGroup
      label={groupLabel}
      className={styles.form_group}
      isPipetteSettingsSlideout={true}
    >
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
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingTop={SPACING.spacing4}
      paddingBottom={SPACING.spacing4}
    >
      <StyledText
        as="label"
        id={props.labelFor}
        paddingBottom={SPACING.spacing8}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        {props.label}
      </StyledText>
      {props.children}
    </Flex>
  )
}

export interface ConfigInputProps {
  field: DisplayFieldProps
}

export function ConfigInput(props: ConfigInputProps): JSX.Element {
  const { field } = props
  const { name, units, displayName } = field
  const id = makeId(field.name)
  const _default = field.default?.toString()
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
            }}
          />
        )}
      </Field>
    </ConfigFormRow>
  )
}

export interface ConfigCheckboxProps {
  field: DisplayQuirkFieldProps
}

export function ConfigCheckbox(props: ConfigCheckboxProps): JSX.Element {
  const { field } = props
  const { name, displayName } = field
  const id = makeId(name)
  return (
    <Flex key={id} flexDirection="row" fontSize="11px">
      <Field name={name} type="checkbox">
        {(fieldProps: FieldProps) => (
          <CheckboxField
            name={fieldProps.field.name}
            onChange={fieldProps.field.onChange}
            value={fieldProps.field.checked}
          />
        )}
      </Field>
      <StyledText paddingLeft={SPACING.spacing8} paddingTop={SPACING.spacing2}>
        {displayName}
      </StyledText>
    </Flex>
  )
}

export interface ConfigQuirkGroupProps {
  quirks: DisplayQuirkFieldProps[]
}

export function ConfigQuirkGroup(props: ConfigQuirkGroupProps): JSX.Element {
  const { quirks } = props
  return (
    <FormGroup className={styles.form_group}>
      {quirks.map((field, index) => {
        return <ConfigCheckbox field={field} key={index} />
      })}
    </FormGroup>
  )
}
