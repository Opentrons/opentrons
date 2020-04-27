// @flow
import React from 'react'
import { useField } from 'formik'
import { DropdownField } from '@opentrons/components/src/forms/DropdownField'

type ModelDropdownProps = {|
  fieldName: string,
  error: string | null,
  disabled: boolean,
  tabIndex: number,
  options: Array<{|
    name: string,
    value: string,
    disabled?: boolean,
  |}>,
|}

export const SlotDropdown = (props: ModelDropdownProps) => {
  const { fieldName, options, error, disabled, tabIndex } = props
  const [field] = useField(props.fieldName)
  return (
    <DropdownField
      tabIndex={tabIndex}
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
