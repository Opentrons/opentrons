/* eslint-disable import/no-default-export */
// @flow
import pick from 'lodash/pick'
import { chainPatchUpdaters, fieldHasChanged } from './utils'
import getDefaultsForStepType from '../getDefaultsForStepType'
import type { FormData, StepFieldName } from '../../../form-types'
import type { FormPatch } from '../../actions/types'

// TODO: Ian 2019-02-21 import this from a more central place - see #2926
const getDefaultFields = (...fields: Array<StepFieldName>): FormPatch =>
  pick(getDefaultsForStepType('pause'), fields)

const updatePatchOnPauseTemperatureChange = (
  patch: FormPatch,
  rawForm: FormData
) => {
  if (fieldHasChanged(rawForm, patch, 'pauseForAmountOfTime')) {
    return {
      ...patch,
      ...getDefaultFields(
        'pauseTemperature',
        'pauseHour',
        'pauseMinute',
        'pauseSecond'
      ),
    }
  }
  return patch
}

export function dependentFieldsUpdatePause(
  originalPatch: FormPatch,
  rawForm: FormData // raw = NOT hydrated
): FormPatch {
  // sequentially modify parts of the patch until it's fully updated
  return chainPatchUpdaters(originalPatch, [
    chainPatch => updatePatchOnPauseTemperatureChange(chainPatch, rawForm),
  ])
}
