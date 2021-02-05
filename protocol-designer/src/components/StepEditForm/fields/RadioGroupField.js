// @flow
import * as React from 'react'
import { RadioGroup } from '@opentrons/components'
import type { StepFieldName } from '../../../steplist/fieldLevel'
import type { FieldProps } from './makeSingleEditFieldProps'

type RadioGroupFieldProps = {|
  ...FieldProps,
  name: StepFieldName,
  options: $PropertyType<React.ElementProps<typeof RadioGroup>, 'options'>,
  className?: string,
|}

export const RadioGroupField = (props: RadioGroupFieldProps): React.Node => {
  // TODO IMMEDIATELY tooltipcontent
  const {
    name,
    value,
    errorToShow,
    updateValue,
    onFieldFocus,
    onFieldBlur,
    className,
    disabled, // TODO IMMEDIATELY use this?
    tooltipContent, // TODO IMMEDIATELY
    ...radioGroupProps
  } = props
  return (
    <RadioGroup
      {...radioGroupProps}
      className={className}
      value={value ? String(value) : ''}
      error={errorToShow}
      onChange={(e: SyntheticEvent<*>) => {
        updateValue(e.currentTarget.value)
        // NOTE(IL, 2020-01-29): to allow the intented pristinity UX, this component "blurs" onchange
        if (onFieldBlur) {
          onFieldBlur()
        }
      }}
    />
  )
}
