// @flow
import type { FormData, StepFieldName } from '../../form-types'
import type { FieldPropsByName } from './fields/useSingleEditFieldProps'

export type FocusHandlers = {|
  focusedField: StepFieldName,
  dirtyFields: Array<StepFieldName>,
  // NOTE: focus & blur take a field name as an arg, unlike onFieldBlur/onFieldFocus
  focus: StepFieldName => void,
  blur: StepFieldName => void,
|}

// Shared props across all step forms
export type StepFormProps = {|
  // TODO(IL, 2021-02-04) type this as HydratedFormData. See #3161
  formData: FormData,

  focusHandlers: FocusHandlers,
  propsForFields: FieldPropsByName,
|}
