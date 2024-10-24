import type { FormData, StepFieldName } from '../../../../form-types'
import type { StepFormErrors } from '../../../../steplist'
export interface FocusHandlers {
  focusedField: StepFieldName | null
  dirtyFields: StepFieldName[]
  focus: (arg: StepFieldName) => void
  blur: (arg: StepFieldName) => void
}
export interface FieldProps {
  disabled: boolean
  name: string
  onFieldBlur: () => void
  onFieldFocus: () => void
  updateValue: (arg: unknown) => void
  value: unknown
  errorToShow?: string | null
  isIndeterminate?: boolean
  tooltipContent?: string | null
}
export type FieldPropsByName = Record<StepFieldName, FieldProps>

// Shared props across all step forms
export interface StepFormProps {
  formData: FormData
  focusHandlers: FocusHandlers
  propsForFields: FieldPropsByName
  toolboxStep: number
  visibleFormErrors: StepFormErrors
}
