import type { UseFormReturn } from 'react-hook-form'
import type { NewProtocolFields } from '../../load-file'
import type { FormModules, FormPipettesByMount } from '../../step-forms'
export type AdditionalEquipment =
  | 'gripper'
  | 'wasteChute'
  | 'trashBin'
  | 'stagingArea_cutoutA3'
  | 'stagingArea_cutoutB3'
  | 'stagingArea_cutoutC3'
  | 'stagingArea_cutoutD3'

export interface WizardFormState {
  fields: NewProtocolFields
  pipettesByMount: FormPipettesByMount
  modules: FormModules | null
  additionalEquipment: AdditionalEquipment[]
}

export interface WizardTileProps extends UseFormReturn<WizardFormState> {
  proceed: (stepsForward?: number) => void
  goBack: (stepsBack?: number) => void
}
