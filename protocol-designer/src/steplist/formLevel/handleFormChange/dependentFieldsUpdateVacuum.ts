import pick from 'lodash/pick'

import { getDefaultsForStepType } from '../getDefaultsForStepType'
import { chainPatchUpdaters, fieldHasChanged } from './utils'

import type { FormData, StepFieldName } from '../../../form-types'
import type { FormPatch } from '../../actions/types'

const getDefaultFields = (...fields: StepFieldName[]): FormPatch =>
  pick(getDefaultsForStepType('vacuum'), fields)

const updatePatchOnVacuumProgramType = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  if (
    rawForm.programType != null &&
    fieldHasChanged(rawForm, patch, 'programType')
  ) {
    return {
      ...patch,
      ...getDefaultFields(
        'stateType',
        'modeType',
        'pressureMbar',
        'percentPower',
        'pumpDurationCheckbox',
        'pumpDurationTime',
        'endingHoldVentCheckbox',
        'vacuumOrderedProfileIds',
        'vacuumProfileItemsById'
      ),
    }
  }
  return patch
}

const updatePatchOnVacuumStateType = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  if (
    rawForm.stateType != null &&
    fieldHasChanged(rawForm, patch, 'stateType')
  ) {
    return {
      ...patch,
      ...getDefaultFields(
        'modeType',
        'pressureMbar',
        'percentPower',
        'pumpDurationCheckbox',
        'pumpDurationTime',
        'endingHoldVentCheckbox'
      ),
    }
  }
  return patch
}

const updatePatchOnVacuumModeType = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  if (rawForm.modeType != null && fieldHasChanged(rawForm, patch, 'modeType')) {
    return {
      ...patch,
      ...getDefaultFields(
        'pressureMbar',
        'percentPower',
        'pumpDurationCheckbox',
        'pumpDurationTime'
      ),
    }
  }
  return patch
}

const updatePatchOnVacuumEndingHoldVentCheckbox = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  if (
    fieldHasChanged(rawForm, patch, 'pumpDurationCheckbox') &&
    patch.pumpDurationCheckbox === true
  ) {
    return {
      ...patch,
      endingHoldVentCheckbox: true,
    }
  }
  return patch
}

export const dependentFieldsUpdateVacuum = (
  originalPatch: FormPatch,
  rawForm: FormData
): FormPatch => {
  return chainPatchUpdaters(originalPatch, [
    chainPatch => updatePatchOnVacuumProgramType(chainPatch, rawForm),
    chainPatch => updatePatchOnVacuumStateType(chainPatch, rawForm),
    chainPatch => updatePatchOnVacuumModeType(chainPatch, rawForm),
    chainPatch =>
      updatePatchOnVacuumEndingHoldVentCheckbox(chainPatch, rawForm),
  ])
}
