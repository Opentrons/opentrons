// @flow

import type { StepFieldName } from '../../form-types'

export type FocusHandlers = {|
  focusedField: StepFieldName,
  dirtyFields: Array<StepFieldName>,
  onFieldFocus: StepFieldName => void,
  onFieldBlur: StepFieldName => void,
|}
