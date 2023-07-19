import * as React from 'react'
import { RadioGroup } from '@opentrons/components'
import { StepFieldName } from '../../../steplist/fieldLevel'
import { FieldProps } from '../types'

interface RadioGroupFieldProps extends FieldProps {
  name: StepFieldName
  options: React.ComponentProps<typeof RadioGroup>['options']
  className?: string
}

export const RadioGroupField = (props: RadioGroupFieldProps): JSX.Element => {
  const {
    className,
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
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
        updateValue(e.currentTarget.value)
        // NOTE(IL, 2020-01-29): to allow the intented pristinity UX, this component "blurs" onchange
        if (onFieldBlur) {
          onFieldBlur()
        }
      }}
    />
  )
}
