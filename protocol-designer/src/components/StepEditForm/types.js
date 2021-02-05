// @flow
import type { Node } from 'react'
import type { FormData, StepFieldName } from '../../form-types'
import type { FieldPropsByName } from './fields/makeSingleEditFieldProps'

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

export type FieldProps = {|
  disabled: boolean,
  name: string,
  updateValue: mixed => void,
  value: mixed,
  errorToShow: ?string,
  tooltipContent?: Node,
  onFieldBlur?: () => mixed,
  onFieldFocus?: () => mixed,
  // isIndeterminate?: boolean, // TODO: this will be needed in useBatchEditFieldProps #7222
|}
