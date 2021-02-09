// @flow
import type { FormData, StepFieldName } from '../../form-types'

export type FocusHandlers = {|
  focusedField: StepFieldName,
  dirtyFields: Array<StepFieldName>,
  // NOTE: focus & blur take a field name as an arg, unlike onFieldBlur/onFieldFocus in FieldProps
  focus: StepFieldName => void,
  blur: StepFieldName => void,
|}

export type FieldProps = {|
  disabled: boolean,
  name: string,
  updateValue: mixed => void,
  value: mixed,
  errorToShow: ?string,
  onFieldBlur: () => mixed,
  onFieldFocus: () => mixed,
  isIndeterminate?: boolean,
|}

export type FieldPropsByName = {
  [name: StepFieldName]: FieldProps,
  ...
}

// Shared props across all step forms
export type StepFormProps = {|
  formData: FormData,
  focusHandlers: FocusHandlers,
  propsForFields: FieldPropsByName,
|}
