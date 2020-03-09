// @flow
import * as React from 'react'

import { InputField, CheckboxField } from '@opentrons/components'
import { FormTableRow } from './FormTableRow'
import { LABEL_SHOW_PASSWORD } from './constants'

export type StringFieldProps = {|
  isPassword: boolean,
  label: string,
  error: string | null,
  id: string,
  name: string,
  value: string,
  className?: string,
  onChange: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  onBlur: (event: SyntheticFocusEvent<HTMLInputElement>) => mixed,
|}

export const StringField = (props: StringFieldProps) => {
  const { isPassword, label, ...fieldProps } = props
  const [showPw, toggleShowPw] = React.useReducer(show => !show, false)
  const type = isPassword && !showPw ? 'password' : 'text'

  return (
    <>
      <FormTableRow label={label} labelFor={fieldProps.id}>
        <InputField {...{ type, ...fieldProps }} />
      </FormTableRow>
      {isPassword && (
        <FormTableRow>
          <CheckboxField
            label={LABEL_SHOW_PASSWORD}
            value={showPw}
            onChange={toggleShowPw}
          />
        </FormTableRow>
      )}
    </>
  )
}
