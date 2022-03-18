import pick from 'lodash/pick'
import { chainPatchUpdaters, fieldHasChanged } from './utils'
import { getDefaultsForStepType } from '../getDefaultsForStepType'
import { FormData, StepFieldName } from '../../../form-types'
import { FormPatch } from '../../actions/types'

// TODO: Ian 2019-02-21 import this from a more central place - see #2926
const getDefaultFields = (...fields: StepFieldName[]): FormPatch =>
  pick(getDefaultsForStepType('heaterShaker'), fields)

const updatePatchOnHeaterShakerFormType = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  // Profile => State
  if (
    rawForm.heaterShakerFormType !== null &&
    fieldHasChanged(rawForm, patch, 'heaterShakerFormType')
  ) {
    return {
      ...patch,
      ...getDefaultFields(
        'tempIsActive',
        'targetTemp',
        'shakeIsActive',
        'targetShake',
        'latchOpen',
        'tempIsActiveHold',
        'targetTempHold',
        'shakeIsActiveHold',
        'targetShakeHold',
        'latchOpenHold'
      ),
    }
  }

  return patch
}

const updatePatchOnBlockChange = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  if (fieldHasChanged(rawForm, patch, 'tempIsActive')) {
    return { ...patch, ...getDefaultFields('targetTemp') }
  } else if (fieldHasChanged(rawForm, patch, 'temoIsActiveHold')) {
    return { ...patch, ...getDefaultFields('targetTempHold') }
  }

  return patch
}

const updatePatchOnLidChange = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  if (fieldHasChanged(rawForm, patch, 'shakeIsActive')) {
    return { ...patch, ...getDefaultFields('targetShake') }
  } else if (fieldHasChanged(rawForm, patch, 'shakeIsActiveHold')) {
    return { ...patch, ...getDefaultFields('targetShakeHold') }
  }

  return patch
}

export function dependentFieldsUpdateThermocycler(
  originalPatch: FormPatch,
  rawForm: FormData // raw = NOT hydrated
): FormPatch {
  // sequentially modify parts of the patch until it's fully updated
  return chainPatchUpdaters(originalPatch, [
    chainPatch => updatePatchOnHeaterShakerFormType(chainPatch, rawForm),
    chainPatch => updatePatchOnBlockChange(chainPatch, rawForm),
    chainPatch => updatePatchOnLidChange(chainPatch, rawForm),
  ])
}
