import pick from 'lodash/pick'

import { ALL, SINGLE } from '@opentrons/shared-data'

import { getDefaultsForStepType } from '../getDefaultsForStepType'
import {
  chainPatchUpdaters,
  fieldHasChanged,
  getAllWellsFromPrimaryWells,
  getChannels,
  getDefaultWells,
} from './utils'

import type { NozzleConfigurationStyle } from '@opentrons/shared-data'
import type {
  LabwareEntities,
  PipetteEntities,
} from '@opentrons/step-generation'
import type { FormData, StepFieldName } from '../../../form-types'
import type { FormPatch } from '../../actions/types'

// TODO: Ian 2019-02-21 import this from a more central place - see #2926
const getDefaultFields = (...fields: StepFieldName[]): FormPatch =>
  pick(getDefaultsForStepType('mix'), fields)

const updatePatchOnLabwareChange = (
  patch: FormPatch,
  rawForm: FormData,
  labwareEntities: LabwareEntities,
  pipetteEntities: PipetteEntities
): FormPatch => {
  const labwareChanged = fieldHasChanged(rawForm, patch, 'labware')
  if (!labwareChanged) return patch
  const appliedPatch = { ...rawForm, ...patch }
  const pipetteId = appliedPatch.pipette
  return {
    ...patch,
    ...getDefaultFields(
      'mix_mmFromBottom',
      'mix_touchTip_mmFromTop',
      'mix_touchTip_checkbox'
    ),
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
): FormPatch => {
  if (patch.pipette === undefined) return patch
  let update = {}
  const previousChannels = getChannels(
    rawForm.pipette as string,
    pipetteEntities
  )
  const nextChannels =
    typeof patch.pipette === 'string'
      ? getChannels(patch.pipette as string, pipetteEntities)
      : null

  const appliedPatch = { ...rawForm, ...patch }

  const singleToMulti =
    previousChannels === 1 && nextChannels === 8 && patch.nozzles !== SINGLE
  const multiToSingle =
    previousChannels === 8 && rawForm.nozzles !== SINGLE && nextChannels === 1

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

    if (labwareId != null) {
      const labwareDef = labwareEntities[labwareId].def
      update = {
        wells: getAllWellsFromPrimaryWells(
          appliedPatch.wells as string[],
          labwareDef,
          previousChannels
        ),
      }
    }
  }

  return { ...patch, ...update }
}

const updatePatchOnPipetteChange = (
  patch: FormPatch,
  rawForm: FormData,
  pipetteEntities: PipetteEntities
): FormPatch => {
  // when pipette ID is changed (to another ID, or to null),
  // set any flow rates to null
  if (fieldHasChanged(rawForm, patch, 'pipette')) {
    let nozzles: NozzleConfigurationStyle | null = null
    const newPipette = patch.pipette

    if (typeof newPipette === 'string' && newPipette in pipetteEntities) {
      const hasPartialTipSupportedChannel =
        pipetteEntities[newPipette].spec.channels !== 1
      nozzles = hasPartialTipSupportedChannel ? ALL : null
    }

    return {
      ...patch,
      ...getDefaultFields('aspirate_flowRate', 'dispense_flowRate', 'tipRack'),
      nozzles,
    }
  }

  return patch
}

const updatePatchOnTiprackChange = (
  patch: FormPatch,
  rawForm: FormData
): FormPatch => {
  if (fieldHasChanged(rawForm, patch, 'tipRack')) {
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
    chainPatch => updatePatchOnTiprackChange(chainPatch, rawForm),
  ])
}
