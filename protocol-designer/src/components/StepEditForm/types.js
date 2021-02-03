// @flow
import type { FormData, StepFieldName } from '../../form-types'

export type FocusHandlers = {|
  focusedField: StepFieldName,
  dirtyFields: Array<StepFieldName>,
  // NOTE: focus & blur take a field name as an arg, unlike onFieldBlur/onFieldFocus
  focus: StepFieldName => void,
  blur: StepFieldName => void,
|}

// Shared props across all step forms
export type StepFormProps = {|
  focusHandlers: FocusHandlers,
  formData: FormData,
|}
