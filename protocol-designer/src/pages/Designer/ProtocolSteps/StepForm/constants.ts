import type { StepType } from '../../../../form-types'

// used to inform StepFormToolbox when to prompt user confirmation for overriding advanced settings
export const FORM_TYPE_TO_FIELDS_REQUIRING_CONFIRMATION: Record<
  StepType,
  string[]
> = {
  mix: ['pipette', 'tipRack', 'liquidClass', 'volume', 'path'],
  moveLiquid: ['pipette', 'tipRack', 'liquidClass', 'volume', 'path'],
  absorbanceReader: [],
  comment: [],
  heaterShaker: [],
  magnet: [],
  manualIntervention: [],
  moveLabware: [],
  pause: [],
  temperature: [],
  thermocycler: [],
}
