import cx from 'classnames'
import * as React from 'react'
import {
  SelectField,
  Tooltip,
  useHover,
  useHoverTooltip,
} from '@opentrons/components'
import { Field } from 'formik'
import { reportFieldEdit } from '../analyticsUtils'
import { getLabel, LabwareFields } from '../fields'
import type { Option, Options } from '../fields'
import fieldStyles from './fieldStyles.css'
import styles from './Dropdown.css'

export interface DropdownProps {
  name: keyof LabwareFields
  disabled?: boolean
  tooltip?: JSX.Element
  options: Options
  caption?: string
  /** optionally override the default onValueChange */
  onValueChange?: React.ComponentProps<typeof SelectField>['onValueChange']
}

export const OptionLabel = (props: Option): JSX.Element => (
  <div className={styles.option_row}>
    {props.imgSrc != null && (
      <img className={styles.option_image} src={props.imgSrc} />
    )}
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

  const [targetProps, tooltipProps] = useHoverTooltip()

  return (
    <>
      {props.tooltip != null && (
        <Tooltip {...tooltipProps}>{props.tooltip}</Tooltip>
      )}

      <div {...targetProps} className={fieldStyles.field_wrapper}>
        <label
          className={cx(fieldStyles.field_label, {
            [fieldStyles.disabled]: props.disabled,
          })}
        >
          <Field name={props.name}>
            {/* @ts-expect-error(IL, 2021-03-24): formik types need cleanup w LabwareFields */}
            {({ field, form }) => (
              <div style={{ width: '18rem' }}>
                {/* TODO IMMEDIATELY ^^^ don't inline style; allow instance to be styled via style props */}
                {getLabel(field.name, form.values)}
                <SelectField
                  disabled={props.disabled}
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
                    const option = props.options.find(
                      opt => opt.value === value
                    )
                    return option ? <OptionLabel {...option} /> : null
                  }}
                />
              </div>
            )}
          </Field>
        </label>
      </div>
    </>
  )
}
