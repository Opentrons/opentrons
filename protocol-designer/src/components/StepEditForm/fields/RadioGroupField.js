// @flow
import * as React from 'react'
import { RadioGroup } from '@opentrons/components'
import type { StepFieldName } from '../../../steplist/fieldLevel'
import type { FocusHandlers } from '../types'
import { FieldConnector } from './FieldConnector'

type RadioGroupFieldProps = {|
  ...FocusHandlers,
  name: StepFieldName,
  options: $PropertyType<React.ElementProps<typeof RadioGroup>, 'options'>,
  className?: string,
|}

const RadioGroupFieldComponent = (
  props: RadioGroupFieldProps,
  ref
): React.Node => {
  const {
    name,
    onFieldFocus,
    onFieldBlur,
    focusedField,
    dirtyFields,
    className,
    ...radioGroupProps
  } = props
  return (
    <FieldConnector
      name={name}
      focusedField={focusedField}
      dirtyFields={dirtyFields}
      render={({ value, updateValue, errorToShow }) => (
        <RadioGroup
          {...radioGroupProps}
          ref={ref}
          className={className}
          value={value ? String(value) : ''}
          error={errorToShow}
          onChange={(e: SyntheticEvent<*>) => {
            updateValue(e.currentTarget.value)
            onFieldBlur(name)
          }}
        />
      )}
    />
  )
}

export const RadioGroupField: React.AbstractComponent<
  RadioGroupFieldProps,
  typeof RadioGroupField
> = React.forwardRef(RadioGroupFieldComponent)
