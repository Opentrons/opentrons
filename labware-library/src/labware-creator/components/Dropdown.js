// @flow
import * as React from 'react'
import { SelectField } from '@opentrons/components'
import { Field } from 'formik'
import { LABELS } from '../fields'
import type { LabwareFields, Options } from '../fields'
import fieldStyles from './fieldStyles.css'
import styles from './Dropdown.css'

type Props = {|
  name: $Keys<LabwareFields>,
  options: Options,
  /** optionally override the default onValueChange */
  onValueChange?: $PropertyType<
    React.ElementProps<typeof SelectField>,
    'onValueChange'
  >,
|}

export const OptionLabel = (props: $ElementType<Options, number>) => (
  <div className={styles.option_row}>
    {props.imgSrc && <img className={styles.option_image} src={props.imgSrc} />}
    <div className={styles.option_label}>{props.name}</div>
  </div>
)

const Dropdown = (props: Props) => {
  const options = React.useMemo(
    () =>
      props.options.map(o => ({
        value: o.value,
        label: <OptionLabel {...o} />,
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
            value={field.value}
            onLoseFocus={() => field.onBlur()}
            onValueChange={
              props.onValueChange ||
              ((name, value) => form.setFieldValue(name, value))
            }
            options={options}
          />
        )}
      </Field>
    </div>
  )
}

export default Dropdown
