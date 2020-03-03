// @flow
import pick from 'lodash/pick'
import {
  chainPatchUpdaters,
  fieldHasChanged,
  getChannels,
  getDefaultWells,
  getAllWellsFromPrimaryWells,
} from './utils'
import { getDefaultsForStepType } from '../getDefaultsForStepType'
import type { FormData, StepFieldName } from '../../../form-types'
import type { FormPatch } from '../../actions/types'
import type {
  LabwareEntities,
  PipetteEntities,
} from '../../../step-forms/types'

// TODO: Ian 2019-02-21 import this from a more central place - see #2926
const getDefaultFields = (...fields: Array<StepFieldName>): FormPatch =>
  pick(getDefaultsForStepType('mix'), fields)

const updatePatchOnLabwareChange = (
  patch: FormPatch,
  rawForm: FormData,
  labwareEntities: LabwareEntities,
  pipetteEntities: PipetteEntities
): FormPatch => {
  const labwareChanged = fieldHasChanged(rawForm, patch, 'labware')

  if (!labwareChanged) return patch

  // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
  const appliedPatch = { ...rawForm, ...patch }
  const pipetteId = appliedPatch.pipette

  return {
    ...patch,
    ...getDefaultFields('mix_mmFromBottom', 'mix_touchTip_mmFromBottom'),
    wells: getDefaultWells({
      labwareId: appliedPatch.labware,
      pipetteId,
      labwareEntities,
      pipetteEntities,
    }),
  }
}

// NOTE: this is similar to fn in moveLiquid dependentFieldsUpdate,
// if it's used more consider making a util
const updatePatchOnPipetteChannelChange = (
  patch: FormPatch,
  rawForm: FormData,
  labwareEntities: LabwareEntities,
  pipetteEntities: PipetteEntities
) => {
  if (patch.pipette === undefined) return patch
  let update = {}

  const prevChannels = getChannels(rawForm.pipette, pipetteEntities)
  const nextChannels =
    typeof patch.pipette === 'string'
      ? getChannels(patch.pipette, pipetteEntities)
      : null

  // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
  const appliedPatch = { ...rawForm, ...patch }
  const singleToMulti = prevChannels === 1 && nextChannels === 8
  const multiToSingle = prevChannels === 8 && nextChannels === 1

  if (patch.pipette === null || singleToMulti) {
    // reset all well selection
    const pipetteId = appliedPatch.pipette
    update = {
      wells: getDefaultWells({
        labwareId: appliedPatch.labware,
        pipetteId,
        labwareEntities,
        pipetteEntities,
      }),
    }
  } else if (multiToSingle) {
    // multi-channel to single-channel: convert primary wells to all wells
    const labwareId = appliedPatch.labware
    const labwareDef = labwareEntities[labwareId].def

    update = {
      wells: getAllWellsFromPrimaryWells(appliedPatch.wells, labwareDef),
    }
  }
  // $FlowFixMe(IL, 2020-02-24): address in #3161, underspecified form fields may be overwritten in type-unsafe manner
  return { ...patch, ...update }
}

const updatePatchOnPipetteChange = (
  patch: FormPatch,
  rawForm: FormData,
  pipetteEntities: PipetteEntities
) => {
  // when pipette ID is changed (to another ID, or to null),
  // set any flow rates to null
  if (fieldHasChanged(rawForm, patch, 'pipette')) {
    return {
      ...patch,
      ...getDefaultFields('aspirate_flowRate', 'dispense_flowRate'),
    }
  }

  return patch
}

export function dependentFieldsUpdateMix(
  originalPatch: FormPatch,
  rawForm: FormData, // raw = NOT hydrated
  pipetteEntities: PipetteEntities,
  labwareEntities: LabwareEntities
): FormPatch {
  // sequentially modify parts of the patch until it's fully updated
  return chainPatchUpdaters(originalPatch, [
    chainPatch =>
      updatePatchOnLabwareChange(
        chainPatch,
        rawForm,
        labwareEntities,
        pipetteEntities
      ),
    chainPatch =>
      updatePatchOnPipetteChannelChange(
        chainPatch,
        rawForm,
        labwareEntities,
        pipetteEntities
      ),
    chainPatch =>
      updatePatchOnPipetteChange(chainPatch, rawForm, pipetteEntities),
  ])
}
