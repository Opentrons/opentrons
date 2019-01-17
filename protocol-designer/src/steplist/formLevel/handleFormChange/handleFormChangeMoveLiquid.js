// @flow
import type {FormData} from '../../../form-types'
import type {FormPatch} from '../../actions/types'
import type {LabwareEntities, PipetteEntities} from '../../../step-forms/types'

export default function handleFormChangeMoveLiquid (
  patch: FormPatch,
  baseForm: ?FormData,
  pipetteEntities: PipetteEntities,
  labwareEntities: LabwareEntities
): FormPatch {
  // TODO IMMEDIATELY!
  return patch
}
