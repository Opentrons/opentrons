// @flow
import pick from 'lodash/pick'

import type { FormData, StepFieldName } from '../../../form-types'
import type { FormPatch } from '../../actions/types'
import { getDefaultsForStepType } from '../getDefaultsForStepType'
import { chainPatchUpdaters, fieldHasChanged } from './utils'

// TODO: Ian 2019-02-21 import this from a more central place - see #2926
const getDefaultFields = (...fields: Array<StepFieldName>): FormPatch =>
  pick(getDefaultsForStepType('temperature'), fields)

const updatePatchOnSetTemperatureChange = (
  patch: FormPatch,
  rawForm: FormData
) => {
  if (fieldHasChanged(rawForm, patch, 'setTemperature')) {
    return {
      ...patch,
      ...getDefaultFields('targetTemperature'),
    }
  }
  return patch
}

export function dependentFieldsUpdateTemperature(
  originalPatch: FormPatch,
  rawForm: FormData // raw = NOT hydrated
): FormPatch {
  // sequentially modify parts of the patch until it's fully updated
  return chainPatchUpdaters(originalPatch, [
    chainPatch => updatePatchOnSetTemperatureChange(chainPatch, rawForm),
  ])
}
