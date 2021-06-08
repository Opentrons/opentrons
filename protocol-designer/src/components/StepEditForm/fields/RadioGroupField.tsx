// @flow
import * as React from 'react'
import { RadioGroup } from '@opentrons/components'
import type { StepFieldName } from '../../../steplist/fieldLevel'
import type { FieldProps } from '../types'

type RadioGroupFieldProps = {
  ...FieldProps,
  name: StepFieldName,
  options: $PropertyType<React.ElementProps<typeof RadioGroup>, 'options'>,
  className?: string,
}

export const RadioGroupField = (props: RadioGroupFieldProps): React.Node => {
  const {
    className,
    disabled, // NOTE: not used
    errorToShow,
    isIndeterminate, // TODO(IL, 2021-02-05): if we need indeterminate RadioGroupField, we'll want to pass this down into RadioGroup
    name,
    onFieldBlur,
    onFieldFocus,
    tooltipContent,
    updateValue,
    value,
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
