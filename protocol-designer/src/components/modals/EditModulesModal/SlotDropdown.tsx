import * as React from 'react'
import { useField } from 'formik'
import { DropdownField } from '@opentrons/components'

export interface SlotDropdownProps {
  fieldName: string
  disabled: boolean
  tabIndex: number
  options: Array<{
    name: string
    value: string
    disabled?: boolean
  }>
}

export const SlotDropdown = (props: SlotDropdownProps): JSX.Element => {
  const { fieldName, options, disabled, tabIndex } = props
  const [field, meta] = useField(props.fieldName)
  return (
    <DropdownField
      tabIndex={tabIndex}
      options={options}
      name={fieldName}
      value={field.value}
      disabled={disabled}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={meta.error}
    />
  )
}
