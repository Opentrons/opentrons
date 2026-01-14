import pick from 'lodash/pick'

import { getDefaultsForStepType } from '../getDefaultsForStepType'
import { chainPatchUpdaters, fieldHasChanged } from './utils'

import type { FormData, StepFieldName } from '../../../form-types'
import type { FormPatch } from '../../actions/types'

// TODO: Ian 2019-02-21 import this from a more central place - see #2926
const getDefaultFields = (...fields: StepFieldName[]): FormPatch =>
  pick(getDefaultsForStepType('thermocycler'), fields)

const updatePatchOnThermocyclerFormType = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  // Profile => State
  if (
    rawForm.thermocyclerFormType !== null &&
    fieldHasChanged(rawForm, patch, 'thermocyclerFormType')
  ) {
    return {
      ...patch,
      ...getDefaultFields(
        'blockIsActive',
        'blockTargetTemp',
        'lidIsActive',
        'lidTargetTemp',
        'lidOpen',
        'profileVolume',
        'profileTargetLidTemp',
        'orderedProfileItems',
        'profileItemsById'
      ),
    }
  }

  return patch
}

const updatePatchOnBlockChange = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  if (fieldHasChanged(rawForm, patch, 'blockIsActive')) {
    return { ...patch, ...getDefaultFields('blockTargetTemp') }
  }

  return patch
}

const updatePatchOnLidChange = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  if (fieldHasChanged(rawForm, patch, 'lidIsActive')) {
    return { ...patch, ...getDefaultFields('lidTargetTemp') }
  }

  return patch
}

export function dependentFieldsUpdateThermocycler(
  originalPatch: FormPatch,
  rawForm: FormData // raw = NOT hydrated
): FormPatch {
  // sequentially modify parts of the patch until it's fully updated
  return chainPatchUpdaters(originalPatch, [
    chainPatch => updatePatchOnThermocyclerFormType(chainPatch, rawForm),
    chainPatch => updatePatchOnBlockChange(chainPatch, rawForm),
    chainPatch => updatePatchOnLidChange(chainPatch, rawForm),
  ])
}
