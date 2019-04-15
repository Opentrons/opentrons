// @flow
import dependentFieldsUpdateMoveLiquid from './dependentFieldsUpdateMoveLiquid'
import dependentFieldsUpdateMix from './dependentFieldsUpdateMix'
import type { FormData } from '../../../form-types'
import type { FormPatch } from '../../actions/types'
import type {
  HydratedLabwareEntities,
  PipetteEntities,
} from '../../../step-forms/types'

function handleFormChange(
  patch: FormPatch,
  rawForm: ?FormData,
  pipetteEntities: PipetteEntities,
  labwareEntities: HydratedLabwareEntities
): FormPatch {
  if (rawForm == null) {
    return patch
  }

  if (rawForm.stepType === 'moveLiquid') {
    const dependentFieldsPatch = dependentFieldsUpdateMoveLiquid(
      patch,
      rawForm,
      pipetteEntities,
      labwareEntities
    )
    return { ...patch, ...dependentFieldsPatch }
  }
  if (rawForm.stepType === 'mix') {
    const dependentFieldsPatch = dependentFieldsUpdateMix(
      patch,
      rawForm,
      pipetteEntities,
      labwareEntities
    )
    return { ...patch, ...dependentFieldsPatch }
  }

  return patch
}

export default handleFormChange
