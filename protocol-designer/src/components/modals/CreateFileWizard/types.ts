import type {
  FormPipettesByMount,
  FormModulesByType,
} from '../../../step-forms'

import type { NewProtocolFields } from '../../../load-file'
import { FormikProps } from 'formik'

type AdditionalEquipment = 'gripper'

export interface FormState {
  fields: NewProtocolFields
  pipettesByMount: FormPipettesByMount
  modulesByType: FormModulesByType
  additionalEquipment: AdditionalEquipment[]
}

export interface WizardTileProps extends FormikProps<FormState> {
  proceed: () => void
  goBack: (stepsBack?: number) => void
}