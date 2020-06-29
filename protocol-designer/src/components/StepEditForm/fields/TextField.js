// @flow
import { InputField } from '@opentrons/components'
import * as React from 'react'

import type { StepFieldName } from '../../../steplist/fieldLevel'
import type { FocusHandlers } from '../types'
import { FieldConnector } from './FieldConnector'

type TextFieldProps = {|
  ...FocusHandlers,
  className?: string,
  name: StepFieldName,
|}

export const TextField = (props: {|
  ...TextFieldProps,
  ...React.ElementProps<typeof InputField>,
|}): React.Node => {
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
