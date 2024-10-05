import { DropdownField } from '@opentrons/components'
import type {
  ControllerFieldState,
  ControllerRenderProps,
} from 'react-hook-form'
import type { EditModulesFormValues } from './index'

export interface ModelDropdownProps {
  field: ControllerRenderProps<EditModulesFormValues, 'selectedModel'>
  fieldState: ControllerFieldState
  fieldName: string
  tabIndex: number
  options: Array<{
    name: string
    value: string
    disabled?: boolean
  }>
}
export const ModelDropdown = (props: ModelDropdownProps): JSX.Element => {
  const { fieldName, options, tabIndex, field, fieldState } = props
  return (
    <DropdownField
      tabIndex={tabIndex}
      options={options}
      name={fieldName}
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={
        fieldState.isTouched && fieldState.error
          ? fieldState.error.message
          : null
      }
    />
  )
}
