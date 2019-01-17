// @flow
import assert from 'assert'
import uniq from 'lodash/uniq'
import {getWellSetForMultichannel} from '../../../well-selection/utils'

import type {PipetteChannels} from '@opentrons/shared-data'
import type {FormData} from '../../../form-types'
import type {StepFieldName} from '../../fieldLevel'
import type {FormPatch} from '../../actions/types'
import type {LabwareEntities, PipetteEntities} from '../../../step-forms/types'

function _getAllWells (
  primaryWells: ?Array<string>,
  labwareType: ?string
): Array<string> {
  if (!labwareType || !primaryWells) {
    return []
  }

  const _labwareType = labwareType // TODO Ian 2018-05-04 remove this weird flow workaround

  const allWells = primaryWells.reduce((acc: Array<string>, well: string) => {
    const nextWellSet = getWellSetForMultichannel(_labwareType, well)
    // filter out any nulls (but you shouldn't get any)
    return (nextWellSet) ? [...acc, ...nextWellSet] : acc
  }, [])

  // remove duplicates (eg trough: [A1, A1, A1, A1, A1, A1, A1, A1] -> [A1])
  return uniq(allWells)
}

function getChannels (pipetteId: string, pipetteEntities: PipetteEntities): PipetteChannels {
  const pipette: ?* = pipetteEntities[pipetteId]
  if (!pipette) {
    assert(false, `${pipetteId} not found in pipettes, cannot handleFormChange properly`)
    return 1
  }
  return pipette.spec.channels
}

function handleFormChange (
  patch: FormPatch,
  baseForm: ?FormData,
  pipetteEntities: PipetteEntities,
  labwareEntities: LabwareEntities
): FormPatch {
  // pass thru, unchanged
  if (baseForm == null) { return patch }

  let updateOverrides = getChangeLabwareEffects(patch)

  if (baseForm.pipette && patch.pipette) {
    if (typeof patch.pipette !== 'string') {
      // this should not happen!
      console.error('no next pipette, could not handleFormChange')
      return patch
    }
    const nextChannels = getChannels(patch.pipette, pipetteEntities)
    updateOverrides = {
      ...updateOverrides,
      ...reconcileFormPipette(baseForm, labwareEntities, pipetteEntities, patch.pipette, nextChannels),
    }
  }

  if (baseForm.stepType === 'distribute') {
    if (typeof patch.pipette === 'string') {
      const pipette = pipetteEntities[patch.pipette]
      assert(pipette, `handleFormChange expected pipette to exist ${String(patch.pipette)}`)
      const disposalVol = pipette.spec.minVolume

      updateOverrides = {
        ...updateOverrides,
        'aspirate_disposalVol_checkbox': true,
        'aspirate_disposalVol_volume': disposalVol,
      }
    }
  }

  return {
    ...patch,
    ...updateOverrides,
  }
}

const getChangeLabwareEffects = (updateFormData: {[StepFieldName]: ?mixed}) => {
  let updateOverrides = {}
  // Changing labware clears wells selection: source labware
  if ('aspirate_labware' in updateFormData) {
    updateOverrides = {
      ...updateOverrides,
      'aspirate_wells': null,
      'aspirate_mmFromBottom': null,
      'aspirate_touchTipMmFromBottom': null,
    }
  }
  // Changing labware clears wells selection: dest labware
  if ('dispense_labware' in updateFormData) {
    updateOverrides = {
      ...updateOverrides,
      'dispense_wells': null,
      'dispense_mmFromBottom': null,
      'dispense_touchTipMmFromBottom': null,
    }
  }
  // Changing labware clears wells selection: labware (eg, mix)
  if ('labware' in updateFormData) {
    updateOverrides = {
      ...updateOverrides,
      'wells': null,
      'mix_mmFromBottom': null,
      'mix_touchTipMmFromBottom': null,
    }
  }
  return updateOverrides
}

const reconcileFormPipette = (formData: FormData, labwareEntities: LabwareEntities, pipetteEntities: PipetteEntities, nextPipetteId: ?mixed, nextChannels: ?number) => {
  const prevChannels = getChannels(formData.pipette, pipetteEntities)

  const singleToMulti = prevChannels === 1 && nextChannels === 8
  const multiToSingle = prevChannels === 8 && nextChannels === 1

  let updateOverrides = {}

  // *****
  // set any flow rates, mix volumes, air gaps, or disposal volumes to null when pipette is changed
  // *****
  if (formData.pipette !== nextPipetteId) {
    if (formData.aspirate_flowRate) {
      updateOverrides = {...updateOverrides, aspirate_flowRate: null}
    }
    if (formData.dispense_flowRate) {
      updateOverrides = {...updateOverrides, dispense_flowRate: null}
    }
    if (formData.aspirate_mix_volume) {
      updateOverrides = {...updateOverrides, aspirate_mix_volume: null}
    }
    if (formData.dispense_mix_volume) {
      updateOverrides = {...updateOverrides, dispense_mix_volume: null}
    }
    if (formData.aspirate_airGap_volume) {
      updateOverrides = {...updateOverrides, aspirate_airGap_volume: null}
    }
    if (formData.aspirate_disposalVol_volume) {
      updateOverrides = {...updateOverrides, aspirate_disposalVol_volume: null}
    }
  }

  // *****
  // Changing pipette from multi-channel to single-channel (and vice versa)
  // modifies well selection
  // *****

  // steptypes with single set of wells (not source + dest)
  if (formData.stepType === 'mix') {
    if (singleToMulti) {
      updateOverrides = {...updateOverrides, wells: null}
    } else if (multiToSingle) {
      // multi-channel to single-channel: convert primary wells to all wells
      const labwareId = formData.labware
      const labware = labwareId && labwareEntities[labwareId]
      const labwareType = labware && labware.type

      updateOverrides = {
        ...updateOverrides,
        wells: _getAllWells(formData.wells, labwareType),
      }
    }
  } else {
    if (singleToMulti) {
      // source + dest well steptypes
      updateOverrides = {...updateOverrides, 'aspirate_wells': null, 'dispense_wells': null}
    } else if (multiToSingle) {
      // multi-channel to single-channel: convert primary wells to all wells
      const sourceLabwareId = formData['aspirate_labware']
      const destLabwareId = formData['dispense_labware']

      const sourceLabware = sourceLabwareId && labwareEntities[sourceLabwareId]
      const sourceLabwareType = sourceLabware && sourceLabware.type
      const destLabware = destLabwareId && labwareEntities[destLabwareId]
      const destLabwareType = destLabware && destLabware.type

      updateOverrides = {
        ...updateOverrides,
        'aspirate_wells': _getAllWells(formData['aspirate_wells'], sourceLabwareType),
        'dispense_wells': _getAllWells(formData['dispense_wells'], destLabwareType),
      }
    }
  }

  return updateOverrides
}

export default handleFormChange
