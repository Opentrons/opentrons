// @flow
import dependentFieldsUpdateMoveLiquid from './dependentFieldsUpdateMoveLiquid'
import type {FormData} from '../../../form-types'
import type {FormPatch} from '../../actions/types'
import type {LabwareEntities, PipetteEntities} from '../../../step-forms/types'

function handleFormChange (
  patch: FormPatch,
  rawForm: ?FormData,
  pipetteEntities: PipetteEntities,
  labwareEntities: LabwareEntities
): FormPatch {
  if (rawForm == null) { return patch }

  if (rawForm.stepType === 'moveLiquid') {
    const dependentFieldsPatch = dependentFieldsUpdateMoveLiquid(patch, rawForm, pipetteEntities, labwareEntities)
    return {...patch, ...dependentFieldsPatch}
  }

  return patch
}

export default handleFormChange
