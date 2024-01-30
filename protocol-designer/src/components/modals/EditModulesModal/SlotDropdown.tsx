import * as React from 'react'
import { DropdownField } from '@opentrons/components'
import type {
  ControllerFieldState,
  ControllerRenderProps,
} from 'react-hook-form'

export interface SlotDropdownProps {
  field: ControllerRenderProps<any, any>
  fieldState: ControllerFieldState
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
  const { field, fieldState } = props
  return (
    <DropdownField
      tabIndex={props.tabIndex}
      options={props.options}
      name={props.fieldName}
      value={field.value}
      disabled={props.disabled}
      onChange={value => field.onChange(value)}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
    />
  )
}
