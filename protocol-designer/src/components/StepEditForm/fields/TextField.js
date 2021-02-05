// @flow
import * as React from 'react'
import { InputField } from '@opentrons/components'
import type { FieldProps } from '../types'

type TextFieldProps = {|
  ...FieldProps,
  className?: string,
  caption?: ?string,
  units?: ?string,
|}

export const TextField = (props: TextFieldProps): React.Node => {
  const {
    updateValue,
    onFieldFocus,
    onFieldBlur,
    errorToShow,
    tooltipContent, // NOTE: this is not used, just stripped from otherProps here
    value,
    ...otherProps
  } = props

  return (
    <InputField
      {...otherProps}
      error={errorToShow}
      onBlur={onFieldBlur}
      onFocus={onFieldFocus}
      onChange={e => updateValue(e.currentTarget.value)}
      value={value ? String(value) : null}
    />
  )
}
