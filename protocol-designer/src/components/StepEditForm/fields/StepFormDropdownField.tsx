// @flow
import * as React from 'react'
import { DropdownField, Options } from '@opentrons/components'
import cx from 'classnames'
import styles from '../StepEditForm.css'
import { StepFieldName } from '../../../steplist/fieldLevel'
import { FieldProps } from '../types'

export type StepFormDropdownProps = FieldProps & {
  options: Options
  name: StepFieldName
  className?: string
}

export const StepFormDropdown = (props: StepFormDropdownProps): React.Node => {
  const {
    options,
    name,
    className,
    onFieldBlur,
    onFieldFocus,
    value,
    updateValue,
    errorToShow,
  } = props
  // TODO: BC abstract e.currentTarget.value inside onChange with fn like onChangeValue of type (value: mixed) => {}
  // blank out the dropdown if labware id does not exist
  const availableOptionIds = options.map(opt => opt.value)
  const fieldValue = availableOptionIds.includes(value) ? String(value) : null

  return (
    <DropdownField
      name={name}
      error={errorToShow}
      className={cx(styles.large_field, className)}
      options={options}
      onBlur={onFieldBlur}
      onFocus={onFieldFocus}
      value={fieldValue}
      onChange={(e: SyntheticEvent<HTMLSelectElement>) => {
        updateValue(e.currentTarget.value)
      }}
    />
  )
}
