// @flow
import * as React from 'react'
import { InputField } from '@opentrons/components'
import type { FieldProps } from './useSingleEditFieldProps'

type TextFieldProps = {|
  ...FieldProps,
  className?: string,

  // TODO IMMEDIATELY
  caption?: ?string,
  units?: ?string,
|}

export const TextField = (props: TextFieldProps): React.Node => {
  const {
    updateValue,
    onFieldFocus,
    onFieldBlur,
    errorToShow,
    tooltipContent,
    value,
    ...otherProps
  } = props

  // TODO IMMEDIATELY: tooltip here
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
