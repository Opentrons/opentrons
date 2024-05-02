import cx from 'classnames'
import * as React from 'react'
import {
  Box,
  SelectField,
  SelectOption,
  StyleProps,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { Field } from 'formik'
import { reportFieldEdit } from '../analyticsUtils'
import { getLabel, LabwareFields } from '../fields'
import type { RichOption, RichOptions } from '../fields'
import fieldStyles from './fieldStyles.module.css'
import styles from './Dropdown.module.css'

export interface DropdownProps extends StyleProps {
  name: keyof LabwareFields
  disabled?: boolean
  tooltip?: JSX.Element
  options: RichOptions
  caption?: string
  /** optionally override the default onValueChange */
  onValueChange?: React.ComponentProps<typeof SelectField>['onValueChange']
}

export const OptionLabel = (props: RichOption): JSX.Element => (
  <div className={styles.option_row}>
    {props.imgSrc != null && (
      <img className={styles.option_image} src={props.imgSrc} />
    )}
    <div className={styles.option_label}>{props.name}</div>
  </div>
)

export const Dropdown = (props: DropdownProps): JSX.Element => {
  const {
    name,
    disabled,
    tooltip,
    options,
    caption,
    onValueChange,
    ...styleProps
  } = props

  const [targetProps, tooltipProps] = useHoverTooltip()

  // change disabled -> isDisabled :(
  const selectFieldOptions: SelectOption[] = options.map(opt => ({
    value: opt.value,
    isDisabled: opt.disabled,
  }))

  return (
    <>
      {tooltip != null && <Tooltip {...tooltipProps}>{tooltip}</Tooltip>}

      <div {...targetProps} className={fieldStyles.field_wrapper}>
        <label
          className={cx(fieldStyles.field_label, {
            [fieldStyles.disabled]: disabled,
          })}
        >
          <Field name={name}>
            {/* @ts-expect-error(IL, 2021-03-24): formik types need cleanup w LabwareFields */}
            {({ field, form }) => (
              <Box {...styleProps}>
                {getLabel(field.name, form.values)}
                <SelectField
                  disabled={disabled}
                  name={field.name}
                  caption={caption}
                  value={field.value}
                  options={selectFieldOptions}
                  onLoseFocus={name => {
                    reportFieldEdit({ value: field.value, name })
                    form.setFieldTouched(name)
                  }}
                  onValueChange={
                    onValueChange ??
                    ((name, value) => form.setFieldValue(name, value))
                  }
                  formatOptionLabel={({ value, label }) => {
                    const option = options.find(opt => opt.value === value)
                    return option !== undefined ? (
                      <OptionLabel {...option} />
                    ) : null
                  }}
                />
              </Box>
            )}
          </Field>
        </label>
      </div>
    </>
  )
}
