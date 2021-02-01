// @flow

import type { StepFieldName } from '../../form-types'

export type FocusHandlers = {|
  focusedField: StepFieldName,
  dirtyFields: Array<StepFieldName>,
  // NOTE: focus & blur take a field name as an arg, unlike onFieldBlur/onFieldFocus
  focus: StepFieldName => void,
  blur: StepFieldName => void,
|}
