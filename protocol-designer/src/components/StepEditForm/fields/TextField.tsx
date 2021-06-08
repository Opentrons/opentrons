// @flow
import * as React from 'react'
import { InputField } from '@opentrons/components'
import type { FieldProps } from '../types'

type TextFieldProps = {
  ...FieldProps,
  className?: string,
  caption?: ?string,
  units?: ?string,
}

export const TextField = (props: TextFieldProps): React.Node => {
  const {
    errorToShow,
    onFieldBlur,
    onFieldFocus,
    tooltipContent,
    updateValue,
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
