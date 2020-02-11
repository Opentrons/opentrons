// @flow
import { dependentFieldsUpdateMoveLiquid } from './dependentFieldsUpdateMoveLiquid'
import { dependentFieldsUpdateMix } from './dependentFieldsUpdateMix'
import { dependentFieldsUpdateMagnet } from './dependentFieldsUpdateMagnet'
import { dependentFieldsUpdatePause } from './dependentFieldsUpdatePause'
import { dependentFieldsUpdateTemperature } from './dependentFieldsUpdateTemperature'

import type { FormData } from '../../../form-types'
import type { FormPatch } from '../../actions/types'
import type {
  LabwareEntities,
  PipetteEntities,
} from '../../../step-forms/types'

export function handleFormChange(
  patch: FormPatch,
  rawForm: ?FormData,
  pipetteEntities: PipetteEntities,
  labwareEntities: LabwareEntities
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
  if (rawForm.stepType === 'magnet') {
    const dependentFieldsPatch = dependentFieldsUpdateMagnet(patch, rawForm)
    return { ...patch, ...dependentFieldsPatch }
  }
  if (rawForm.stepType === 'temperature') {
    const dependentFieldsPatch = dependentFieldsUpdateTemperature(
      patch,
      rawForm
    )
    return { ...patch, ...dependentFieldsPatch }
  }
  if (rawForm.stepType === 'pause') {
    const dependentFieldsPatch = dependentFieldsUpdatePause(patch, rawForm)
    return { ...patch, ...dependentFieldsPatch }
  }

  return patch
}
