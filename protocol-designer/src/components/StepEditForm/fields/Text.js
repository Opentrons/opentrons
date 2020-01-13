// @flow
import * as React from 'react'
import { InputField } from '@opentrons/components'
import type { StepFieldName } from '../../../steplist/fieldLevel'
import type { FocusHandlers } from '../types'
import { FieldConnector } from './FieldConnector'

type TextFieldProps = {
  className?: string,
  name: StepFieldName,
} & FocusHandlers
export const TextField = (
  props: TextFieldProps & React.ElementProps<typeof InputField>
) => {
  const {
    name,
    focusedField,
    dirtyFields,
    onFieldFocus,
    onFieldBlur,
    ...inputProps
  } = props
  return (
    <FieldConnector
      name={name}
      focusedField={focusedField}
      dirtyFields={dirtyFields}
      render={({ value, updateValue, errorToShow, hoverTooltipHandlers }) => (
        <InputField
          {...inputProps}
          error={errorToShow}
          onBlur={() => {
            onFieldBlur(name)
          }}
          onFocus={() => {
            onFieldFocus(name)
          }}
          onChange={(e: SyntheticInputEvent<*>) =>
            updateValue(e.currentTarget.value)
          }
          value={value ? String(value) : null}
        />
      )}
    />
  )
}
