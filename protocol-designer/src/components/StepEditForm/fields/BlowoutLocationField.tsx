import * as React from 'react'
import { useSelector } from 'react-redux'
import { DropdownField, Options } from '@opentrons/components'
import cx from 'classnames'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import styles from '../StepEditForm.css'
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

  const disposalLabwareOptions = useSelector(
    uiLabwareSelectors.getDisposalLabwareOptions
  )
  const options = [...disposalLabwareOptions, ...props.options]

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
