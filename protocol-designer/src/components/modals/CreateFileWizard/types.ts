import { FormikProps } from 'formik'
import type {
  FormPipettesByMount,
  FormModulesByType,
} from '../../../step-forms'

import type { NewProtocolFields } from '../../../load-file'

export type AdditionalEquipment =
  | 'gripper'
  | 'wasteChute'
  | 'trashBin'
  | 'stagingArea_cutoutA3'
  | 'stagingArea_cutoutB3'
  | 'stagingArea_cutoutC3'
  | 'stagingArea_cutoutD3'
export interface FormState {
  fields: NewProtocolFields
  pipettesByMount: FormPipettesByMount
  modulesByType: FormModulesByType
  additionalEquipment: AdditionalEquipment[]
}

export interface WizardTileProps extends FormikProps<FormState> {
  proceed: (stepsForward?: number) => void
  goBack: (stepsBack?: number) => void
}
