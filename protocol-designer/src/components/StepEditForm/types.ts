import type { FormData, StepFieldName } from '../../form-types'
export type FocusHandlers = {
  focusedField: StepFieldName | null
  dirtyFields: Array<StepFieldName>
  // NOTE: focus & blur take a field name as an arg, unlike onFieldBlur/onFieldFocus in FieldProps
  focus: (arg0: StepFieldName) => void
  blur: (arg0: StepFieldName) => void
}
export type FieldProps = {
  disabled: boolean
  errorToShow: string | null | undefined
  isIndeterminate?: boolean
  name: string
  onFieldBlur: () => unknown
  onFieldFocus: () => unknown
  tooltipContent?: string | null | undefined
  updateValue: (arg0: unknown) => void
  value: unknown
}
export type FieldPropsByName = Record<StepFieldName, FieldProps>
// Shared props across all step forms
export type StepFormProps = {
  formData: FormData
  focusHandlers: FocusHandlers
  propsForFields: FieldPropsByName
}
