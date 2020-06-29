// @flow
import {
  CheckboxField,
  INPUT_TYPE_PASSWORD,
  INPUT_TYPE_TEXT,
  InputField,
} from '@opentrons/components'
import * as React from 'react'

import { LABEL_SHOW_PASSWORD } from '../i18n'
import { useConnectFormField } from './form-state'
import { FormRow } from './FormRow'

export type TextFieldProps = {|
  id: string,
  name: string,
  label: string,
  isPassword: boolean,
  className?: string,
|}

export const TextField = (props: TextFieldProps): React.Node => {
  const { id, name, label, isPassword, className } = props
  const { value, error, onChange, onBlur } = useConnectFormField(name)
  const [showPw, toggleShowPw] = React.useReducer(show => !show, false)
  const type = isPassword && !showPw ? INPUT_TYPE_PASSWORD : INPUT_TYPE_TEXT

  return (
    <FormRow label={label} labelFor={id}>
      <InputField
        {...{ className, type, id, name, value, error, onChange, onBlur }}
      />
      {isPassword && (
        <CheckboxField
          label={LABEL_SHOW_PASSWORD}
          value={showPw}
          onChange={toggleShowPw}
        />
      )}
    </FormRow>
  )
}
