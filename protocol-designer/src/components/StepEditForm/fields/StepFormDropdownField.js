// @flow
import * as React from 'react'
import { DropdownField, type Options } from '@opentrons/components'
import cx from 'classnames'
import type { StepFieldName } from '../../../steplist/fieldLevel'
import type { FocusHandlers } from '../types'
import styles from '../StepEditForm.css'
import { FieldConnector } from './FieldConnector'

export type StepFormDropdownProps = {
  ...$Exact<FocusHandlers>,
  options: Options,
  name: StepFieldName,
  className?: string,
}

export const StepFormDropdown = (props: StepFormDropdownProps) => {
  const {
    options,
    name,
    className,
    focusedField,
    dirtyFields,
    onFieldBlur,
    onFieldFocus,
  } = props
  return (
    // TODO: BC abstract e.currentTarget.value inside onChange with fn like onChangeValue of type (value: mixed) => {}
    <FieldConnector
      name={name}
      focusedField={focusedField}
      dirtyFields={dirtyFields}
      render={({ value, updateValue, errorToShow }) => {
        // blank out the dropdown if labware id does not exist
        const availableOptionIds = options.map(opt => opt.value)
        const fieldValue = availableOptionIds.includes(value)
          ? String(value)
          : null
        return (
          <DropdownField
            error={errorToShow}
            className={cx(styles.large_field, className)}
            options={options}
            onBlur={() => {
              onFieldBlur(name)
            }}
            onFocus={() => {
              onFieldFocus(name)
            }}
            value={fieldValue}
            onChange={(e: SyntheticEvent<HTMLSelectElement>) => {
              updateValue(e.currentTarget.value)
            }}
          />
        )
      }}
    />
  )
}
