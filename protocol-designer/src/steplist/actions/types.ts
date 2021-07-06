import { StepFieldName } from '../fieldLevel'
export type FormPatch = Partial<Record<StepFieldName, unknown | null>>
// Update Form input (onChange on inputs)
export interface ChangeFormPayload {
  stepId?: string
  // stepId is required for saved step forms, ignored for unsaved form
  update: FormPatch
}
