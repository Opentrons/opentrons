// @flow
import pick from 'lodash/pick'
import { chainPatchUpdaters, fieldHasChanged } from './utils'
import { getDefaultsForStepType } from '../getDefaultsForStepType'
import type { FormData, StepFieldName } from '../../../form-types'
import type { FormPatch } from '../../actions/types'

// TODO: Ian 2019-02-21 import this from a more central place - see #2926
const getDefaultFields = (...fields: Array<StepFieldName>): FormPatch =>
  pick(getDefaultsForStepType('thermocycler'), fields)

const updatePatchOnBlockChange = (patch: FormPatch, rawForm: FormData) => {
  if (fieldHasChanged(rawForm, patch, 'blockIsActive')) {
    return {
      ...patch,
      ...getDefaultFields('blockTargetTemp'),
    }
  } else if (fieldHasChanged(rawForm, patch, 'blockIsActiveHold')) {
    return {
      ...patch,
      ...getDefaultFields('blockTargetTempHold'),
    }
  }
  return patch
}

const updatePatchOnLidChange = (patch: FormPatch, rawForm: FormData) => {
  if (fieldHasChanged(rawForm, patch, 'lidIsActive')) {
    return {
      ...patch,
      ...getDefaultFields('lidTargetTemp'),
    }
  } else if (fieldHasChanged(rawForm, patch, 'lidIsActiveHold')) {
    return {
      ...patch,
      ...getDefaultFields('lidTargetTempHold'),
    }
  }
  return patch
}

export function dependentFieldsUpdateThermocycler(
  originalPatch: FormPatch,
  rawForm: FormData // raw = NOT hydrated
): FormPatch {
  // sequentially modify parts of the patch until it's fully updated
  return chainPatchUpdaters(originalPatch, [
    chainPatch => updatePatchOnBlockChange(chainPatch, rawForm),
    chainPatch => updatePatchOnLidChange(chainPatch, rawForm),
  ])
}
