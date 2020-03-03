// @flow
import type { StepFieldName } from '../fieldLevel'

export type FormPatch = $Shape<{|
  [StepFieldName]: ?mixed, // string | boolean | Array<string> | null,
|}>

// Update Form input (onChange on inputs)
export type ChangeFormPayload = {|
  stepId?: string, // stepId is required for saved step forms, ignored for unsaved form
  update: FormPatch,
|}
