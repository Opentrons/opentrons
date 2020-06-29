// @flow
import { SelectField } from '@opentrons/components'
import { Field } from 'formik'
import * as React from 'react'

import { reportFieldEdit } from '../analyticsUtils'
import type { LabwareFields, Options } from '../fields'
import { LABELS } from '../fields'
import styles from './Dropdown.css'
import fieldStyles from './fieldStyles.css'

export type DropdownProps = {|
  name: $Keys<LabwareFields>,
  options: Options,
  caption?: string,
  /** optionally override the default onValueChange */
  onValueChange?: $PropertyType<
    React.ElementProps<typeof SelectField>,
    'onValueChange'
  >,
|}

export const OptionLabel = (
  props: $ElementType<Options, number>
): React.Node => (
  <div className={styles.option_row}>
    {props.imgSrc && <img className={styles.option_image} src={props.imgSrc} />}
    <div className={styles.option_label}>{props.name}</div>
  </div>
)

export const Dropdown = (props: DropdownProps): React.Node => {
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
