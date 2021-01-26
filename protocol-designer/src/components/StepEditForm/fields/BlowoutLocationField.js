// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { DropdownField, type Options } from '@opentrons/components'
import cx from 'classnames'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { getBlowoutLocationOptionsForForm } from '../utils'
import styles from '../StepEditForm.css'
import type { BaseState } from '../../../types'
import type { FieldProps } from './useSingleEditFieldProps'

type BlowoutLocationDropdownOP = {|
  ...FieldProps,
  className?: string,
|}

type BlowoutLocationDropdownSP = {| options: Options |}

const BlowoutLocationDropdownSTP = (
  state: BaseState,
  ownProps: BlowoutLocationDropdownOP
): BlowoutLocationDropdownSP => {
  const unsavedForm = stepFormSelectors.getUnsavedForm(state)
  const disposalLabwareOptions = uiLabwareSelectors.getDisposalLabwareOptions(
    state
  )
  const options = getBlowoutLocationOptionsForForm(
    disposalLabwareOptions,
    unsavedForm
  )

  return { options }
}

type BlowoutLocationDropdownProps = {
  ...BlowoutLocationDropdownOP,
  ...BlowoutLocationDropdownSP,
}

export const BlowoutLocationField: React.AbstractComponent<BlowoutLocationDropdownOP> = connect<
  BlowoutLocationDropdownProps,
  BlowoutLocationDropdownOP,
  BlowoutLocationDropdownSP,
  _,
  _,
  _
>(BlowoutLocationDropdownSTP)((props: BlowoutLocationDropdownProps) => {
  const {
    options,
    className,
    onFieldBlur,
    onFieldFocus,
    disabled,
    value,
    updateValue,
  } = props
  return (
    // TODO IMMEDIATELY: TOOLTIP CONTENT (see CheckboxRowField)
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
})
