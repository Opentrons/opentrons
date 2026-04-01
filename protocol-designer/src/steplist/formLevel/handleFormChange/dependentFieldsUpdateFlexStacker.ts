import pick from 'lodash/pick'

import { getDefaultsForStepType } from '../getDefaultsForStepType'
import { chainPatchUpdaters, fieldHasChanged } from './utils'

import type { FormData, StepFieldName } from '../../../form-types'
import type { FormPatch } from '../../actions/types'

const getDefaultFields = (...fields: StepFieldName[]): FormPatch =>
  pick(getDefaultsForStepType('flexStacker'), fields)

const updatePatchOnFlexStackerFormType = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  // Profile => State
  if (
    rawForm.flexStackerFormType !== null &&
    fieldHasChanged(rawForm, patch, 'flexStackerFormType')
  ) {
    return {
      ...patch,
      ...getDefaultFields(
        'fillLabwareUri',
        'fillLabwareIds',
        'interventionMessage'
      ),
    }
  }

  return patch
}

export function dependentFieldsUpdateFlexStacker(
  originalPatch: FormPatch,
  rawForm: FormData // raw = NOT hydrated
): FormPatch {
  // sequentially modify parts of the patch until it's fully updated
  return chainPatchUpdaters(originalPatch, [
    chainPatch => updatePatchOnFlexStackerFormType(chainPatch, rawForm),
  ])
}
