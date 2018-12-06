// @flow
import uniq from 'lodash/uniq'
import {getPipetteNameSpecs} from '@opentrons/shared-data'
import {getWellSetForMultichannel} from '../../well-selection/utils'
import {selectors as pipetteSelectors} from '../../pipettes'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'

import type {PipetteChannels} from '@opentrons/shared-data'
import type {BaseState, GetState} from '../../types'
import type {FormData} from '../../form-types'
import type {StepFieldName} from '../fieldLevel'
import type {ChangeFormPayload} from './types'

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

// TODO: Ian 2018-08-28 revisit this,
// maybe remove channels from pipette state and use shared-data?
// or if not, make this its own selector in pipettes/ atom
const getChannels = (pipetteId: string, state: BaseState): PipetteChannels => {
  const pipettes = pipetteSelectors.getPipettesById(state)
  const pipette = pipettes[pipetteId]
  if (!pipette) {
    console.error(`${pipetteId} not found in pipettes, cannot handleFormChange properly`)
    return 1
  }
  return pipette.channels
}

// TODO: Ian 2018-09-20 this is only usable by 'unsavedForm'.
// Eventually we gotta allow arbitrary actions like DELETE_LABWARE
// (or more speculatively, CHANGE_PIPETTE etc), which affect saved forms from
// 'outside', to cause changes that run thru all the logic in this block
function handleFormChange (
  payload: ChangeFormPayload,
  baseForm: ?FormData,
  getState: GetState,
): ChangeFormPayload {
  // Use state to handle form changes
  const baseState = getState()

  // pass thru, unchanged
  if (baseForm == null) { return payload }

  let updateOverrides = getChangeLabwareEffects(payload.update)

  if (baseForm.pipette && payload.update.pipette) {
    if (typeof payload.update.pipette !== 'string') {
      // this should not happen!
      console.error('no next pipette, could not handleFormChange')
      return payload
    }
    const nextChannels = getChannels(payload.update.pipette, baseState)
    updateOverrides = {
      ...updateOverrides,
      ...reconcileFormPipette(baseForm, baseState, payload.update.pipette, nextChannels),
    }
  }

  if (baseForm.stepType === 'distribute') {
    if (typeof payload.update.pipette === 'string') {
      const pipetteData = pipetteSelectors.getPipettesById(baseState)[payload.update.pipette]
      const pipetteSpecs = getPipetteNameSpecs(pipetteData.model)
      const disposalVol = pipetteSpecs
        ? pipetteSpecs.minVolume
        : null

      updateOverrides = {
        ...updateOverrides,
        'aspirate_disposalVol_checkbox': true,
        'aspirate_disposalVol_volume': disposalVol,
      }
    }
  }

  return {
    update: {
      ...payload.update,
      ...updateOverrides,
    },
  }
}

export const getChangeLabwareEffects = (updateFormData: {[StepFieldName]: ?mixed}) => {
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

export const reconcileFormPipette = (formData: FormData, baseState: BaseState, nextPipetteId: ?mixed, nextChannels: ?number) => {
  const prevChannels = getChannels(formData.pipette, baseState)

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
      const labware = labwareId && labwareIngredSelectors.getLabwareById(baseState)[labwareId]
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

      const sourceLabware = sourceLabwareId && labwareIngredSelectors.getLabwareById(baseState)[sourceLabwareId]
      const sourceLabwareType = sourceLabware && sourceLabware.type
      const destLabware = destLabwareId && labwareIngredSelectors.getLabwareById(baseState)[destLabwareId]
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
