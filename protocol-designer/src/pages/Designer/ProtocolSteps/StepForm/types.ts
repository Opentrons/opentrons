import type { FormData, StepFieldName } from '../../../../form-types'
export interface FocusHandlers {
  focusedField: StepFieldName | null
  dirtyFields: StepFieldName[]
  focus: (arg0: StepFieldName) => void
  blur: (arg0: StepFieldName) => void
}
export interface FieldProps {
  disabled: boolean
  errorToShow?: string | null
  isIndeterminate?: boolean
  name: string
  onFieldBlur: () => void
  onFieldFocus: () => void
  tooltipContent?: string | null
  updateValue: (arg0: unknown) => void
  value: unknown
}
export type FieldPropsByName = Record<StepFieldName, FieldProps>

// Shared props across all step forms
export interface StepFormProps {
  formData: FormData
  focusHandlers: FocusHandlers
  propsForFields: FieldPropsByName
}
