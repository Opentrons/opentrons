import * as React from 'react'
import { SelectField } from '@opentrons/components'
import { Field } from 'formik'
import { reportFieldEdit } from '../analyticsUtils'
import { LABELS } from '../fields'
import type { LabwareFields, Option, Options } from '../fields'
import fieldStyles from './fieldStyles.css'
import styles from './Dropdown.css'

export interface DropdownProps {
  name: keyof typeof LABELS
  options: Options
  caption?: string
  /** optionally override the default onValueChange */
  onValueChange?: React.ComponentProps<typeof SelectField>['onValueChange']
}

export const OptionLabel = (props: Option): JSX.Element => (
  <div className={styles.option_row}>
    {props.imgSrc && <img className={styles.option_image} src={props.imgSrc} />}
    <div className={styles.option_label}>{props.name}</div>
  </div>
)

export const Dropdown = (props: DropdownProps): JSX.Element => {
  const options = React.useMemo(
    () =>
      props.options.map(o => ({
        value: o.value,
        isDisabled: o.disabled || false,
      })),
    [props.options]
  )

  return (
    <div className={fieldStyles.field_wrapper}>
      <div className={fieldStyles.field_label}>{LABELS[props.name]}</div>
      <Field name={props.name}>
        {/* @ts-ignore(IL, 2021-03-24): formik types need cleanup w LabwareFields */}
        {({ field, form }) => (
          <SelectField
            name={field.name}
            caption={props.caption}
            value={field.value}
            options={options}
            onLoseFocus={name => {
              reportFieldEdit({ value: field.value, name })
              form.setFieldTouched(name)
            }}
            onValueChange={
              props.onValueChange ||
              ((name, value) => form.setFieldValue(name, value))
            }
            formatOptionLabel={({ value, label }) => {
              const option = props.options.find(opt => opt.value === value)
              return option ? <OptionLabel {...option} /> : null
            }}
          />
        )}
      </Field>
    </div>
  )
}
