// @flow
import React from 'react'
import { DropdownField } from '@opentrons/components/src/forms/DropdownField'
import { useField } from 'formik'

type ModelDropdownProps = {
  fieldName: string,
  error: string | null,
  disabled: boolean,
  options: Array<{|
    name: string,
    value: string,
    disabled?: boolean,
  |}>,
}

export const SlotDropdown = (props: ModelDropdownProps) => {
  const { fieldName, options, error, disabled } = props
  const [field] = useField(props.fieldName)
  return (
    <DropdownField
      tabIndex={1}
      options={options}
      name={fieldName}
      value={field.value}
      disabled={disabled}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={error}
    />
  )
}
