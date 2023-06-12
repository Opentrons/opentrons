import type {
  FormPipettesByMount,
  FormModulesByType,
} from '../../../step-forms'

import type { NewProtocolFields } from '../../../load-file'
import { FormikProps } from 'formik'

export interface FormState {
  fields: NewProtocolFields
  pipettesByMount: FormPipettesByMount
  modulesByType: FormModulesByType
}

export interface WizardTileProps extends FormikProps<FormState> {
  proceed: () => void
  goBack: () => void
}