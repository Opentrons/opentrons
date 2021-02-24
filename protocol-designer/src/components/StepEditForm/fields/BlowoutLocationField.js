// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { DropdownField } from '@opentrons/components'
import cx from 'classnames'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { getBlowoutLocationOptionsForForm } from '../utils'
import styles from '../StepEditForm.css'
import type { FormData } from '../../../form-types'
import type { FieldProps } from '../types'

type BlowoutLocationDropdownProps = {|
  ...FieldProps,
  className?: string,
  formData: FormData,
|}

export const BlowoutLocationField = (
  props: BlowoutLocationDropdownProps
): React.Node => {
  const {
    className,
    disabled,
    formData,
    onFieldBlur,
    onFieldFocus,
    updateValue,
    value,
  } = props

  const disposalLabwareOptions = useSelector(
    uiLabwareSelectors.getDisposalLabwareOptions
  )
  const options = getBlowoutLocationOptionsForForm(
    disposalLabwareOptions,
    formData
  )

  return (
    <DropdownField
      className={cx(styles.large_field, className)}
      options={options}
      disabled={disabled}
      onBlur={onFieldBlur}
      onFocus={onFieldFocus}
      value={value ? String(value) : null}
      onChange={(e: SyntheticEvent<HTMLSelectElement>) => {
        updateValue(e.currentTarget.value)
      }}
    />
  )
}
