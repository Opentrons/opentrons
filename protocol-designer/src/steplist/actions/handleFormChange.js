// @flow
import uniq from 'lodash/uniq'
import {getWellSetForMultichannel} from '../../well-selection/utils'
import {selectors} from '../index'
import {selectors as pipetteSelectors} from '../../pipettes'
import { DEFAULT_MM_FROM_BOTTOM } from '../../constants'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import type {PipetteChannels} from '@opentrons/shared-data'
import type {BaseState, GetState} from '../../types'

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
  const pipettes = pipetteSelectors.pipettesById(state)
  const pipette = pipettes[pipetteId]
  if (!pipette) {
    console.error(`${pipetteId} not found in pipettes, cannot handleFormChange properly`)
    return 1
  }
  return pipette.channels
}

function handleFormChange (payload: ChangeFormPayload, getState: GetState): ChangeFormPayload {
  // Use state to handle form changes
  const baseState = getState()
  const unsavedForm = selectors.formData(baseState)
  let updateOverrides = {}

  if (unsavedForm == null) {
    // pass thru, unchanged
    return payload
  }

  // Changing labware clears wells selection: source labware
  if ('aspirate_labware' in payload.update) {
    updateOverrides = {
      ...updateOverrides,
      'aspirate_wells': null,
      'aspirate_mmFromBottom': DEFAULT_MM_FROM_BOTTOM
    }
  }

  // Changing labware clears wells selection: dest labware
  if ('dispense_labware' in payload.update) {
    updateOverrides = {
      ...updateOverrides,
      'dispense_wells': null,
      'dispense_mmFromBottom': DEFAULT_MM_FROM_BOTTOM
    }
  }

  // Changing labware clears wells selection: labware (eg, mix)
  if ('labware' in payload.update) {
    updateOverrides = {
      ...updateOverrides,
      'wells': null,
      'dispense_mmFromBottom': DEFAULT_MM_FROM_BOTTOM
    }
  }

  if (
    unsavedForm.pipette &&
    payload.update.pipette
  ) {
    const prevPipette: string = unsavedForm.pipette
    const prevChannels = getChannels(prevPipette, baseState)
    const nextPipette = payload.update.pipette

    if (typeof nextPipette !== 'string') {
      // this should not happen!
      console.error('no next pipette, could not handleFormChange')
      return payload
    }
    const nextChannels = getChannels(nextPipette, baseState)

    const singleToMulti = prevChannels === 1 && nextChannels === 8
    const multiToSingle = prevChannels === 8 && nextChannels === 1

    // *****
    // set any flow rates to null when pipette is changed
    // *****
    if (prevPipette !== nextPipette) {
      if (unsavedForm.aspirate_flowRate) {
        updateOverrides = {
          ...updateOverrides,
          aspirate_flowRate: null
        }
      }

      if (unsavedForm.dispense_flowRate) {
        updateOverrides = {
          ...updateOverrides,
          dispense_flowRate: null
        }
      }
    }

    // *****
    // Changing pipette from multi-channel to single-channel (and visa versa)
    // modifies well selection
    // *****

    // steptypes with single set of wells (not source + dest)
    if (unsavedForm.stepType === 'mix') {
      if (singleToMulti) {
        updateOverrides = {
          ...updateOverrides,
          wells: null
        }
      } else if (multiToSingle) {
        // multi-channel to single-channel: convert primary wells to all wells
        const labwareId = unsavedForm.labware
        const labwareType = labwareId && labwareIngredSelectors.getLabware(baseState)[labwareId].type

        updateOverrides = {
          ...updateOverrides,
          wells: _getAllWells(unsavedForm.wells, labwareType)
        }
      }
    } else {
      if (singleToMulti) {
        // source + dest well steptypes
        updateOverrides = {
          ...updateOverrides,
          'aspirate_wells': null,
          'dispense_wells': null
        }
      } else if (multiToSingle) {
        // multi-channel to single-channel: convert primary wells to all wells
        const sourceLabwareId = unsavedForm['aspirate_labware']
        const destLabwareId = unsavedForm['dispense_labware']

        const sourceLabwareType = sourceLabwareId && labwareIngredSelectors.getLabware(baseState)[sourceLabwareId].type
        const destLabwareType = destLabwareId && labwareIngredSelectors.getLabware(baseState)[destLabwareId].type

        updateOverrides = {
          ...updateOverrides,
          'aspirate_wells': _getAllWells(unsavedForm['aspirate_wells'], sourceLabwareType),
          'dispense_wells': _getAllWells(unsavedForm['dispense_wells'], destLabwareType)
        }
      }
    }
  }

  return {
    update: {
      ...payload.update,
      ...updateOverrides
    }
  }
}

export default handleFormChange
