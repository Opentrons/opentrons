// @flow
import * as React from 'react'
import {RadioGroup} from '@opentrons/components'
import type {StepFieldName} from '../../steplist/fieldLevel'
import StepField from './StepFormField'
import type {FocusHandlers} from './index'

type StepRadioGroupProps = {
  name: StepFieldName,
  options: $PropertyType<React.ElementProps<typeof RadioGroup>, 'options'>,
} & FocusHandlers
export const StepRadioGroup = (props: StepRadioGroupProps) => {
  const {name, onFieldFocus, onFieldBlur, focusedField, dirtyFields, ...radioGroupProps} = props
  return (
    <StepField
      name={name}
      focusedField={focusedField}
      dirtyFields={dirtyFields}
      render={({value, updateValue, errorToShow}) => (
        <RadioGroup
          {...radioGroupProps}
          value={value ? String(value) : ''}
          error={errorToShow}
          onChange={(e: SyntheticEvent<*>) => {
            updateValue(e.currentTarget.value)
            onFieldBlur(name)
          }} />
      )} />
  )
}
