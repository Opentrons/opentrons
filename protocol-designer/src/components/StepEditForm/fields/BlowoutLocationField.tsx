import * as React from 'react'
import { useSelector } from 'react-redux'
import { DropdownField, Options } from '@opentrons/components'
import cx from 'classnames'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import styles from '../StepEditForm.module.css'
import { FieldProps } from '../types'

type BlowoutLocationDropdownProps = FieldProps & {
  className?: string
  options: Options
}

export const BlowoutLocationField = (
  props: BlowoutLocationDropdownProps
): JSX.Element => {
  const {
    className,
    disabled,
    onFieldBlur,
    onFieldFocus,
    updateValue,
    value,
  } = props

  const disposalOptions = useSelector(uiLabwareSelectors.getDisposalOptions)
  const options = [...disposalOptions, ...props.options]

  return (
    <DropdownField
      className={cx(styles.large_field, className)}
      options={options}
      disabled={disabled}
      id={'BlowoutLocationField_dropdown'}
      onBlur={onFieldBlur}
      onFocus={onFieldFocus}
      value={value != null ? String(value) : null}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
        updateValue(e.currentTarget.value)
      }}
    />
  )
}
