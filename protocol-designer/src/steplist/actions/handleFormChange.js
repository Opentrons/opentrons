// @flow
import uniq from 'lodash/uniq'
import {getWellSetForMultichannel} from '../../well-selection/utils'
import {selectors} from '../index'
import {selectors as pipetteSelectors} from '../../pipettes'
import { DEFAULT_MM_FROM_BOTTOM } from '../../constants'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import type {PipetteChannels} from '@opentrons/shared-data'
import type {GetState} from '../../types'

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

function handleFormChange (payload: ChangeFormPayload, getState: GetState): ChangeFormPayload {
  // Use state to handle form changes
  const baseState = getState()
  const unsavedForm = selectors.formData(baseState)

  // TODO Ian 2018-05-08 all these transformations should probably be put under
  // `if (unsavedForm.stepType === 'mix') { handleFormChange_mix(payload, unsavedForm, getState)}
  // so they don't get jumbled together

  // Changing labware clears wells selection: source labware
  if (
    unsavedForm !== null &&
    'aspirate_labware' in payload.update
  ) {
    return {
      update: {
        ...payload.update,
        'aspirate_wells': null,
        'aspirate_tipPosition': DEFAULT_MM_FROM_BOTTOM
      }
    }
  }

  // Changing labware clears wells selection: dest labware
  if (
    unsavedForm !== null &&
    'dispense_labware' in payload.update
  ) {
    return {
      update: {
        ...payload.update,
        'dispense_wells': null,
        'dispense_tipPosition': DEFAULT_MM_FROM_BOTTOM
      }
    }
  }

  // Changing labware clears wells selection: labware (eg, mix)
  if (
    unsavedForm !== null &&
    'labware' in payload.update
  ) {
    return {
      update: {
        ...payload.update,
        'wells': null,
        'tipPosition': DEFAULT_MM_FROM_BOTTOM
      }
    }
  }

  // Changing pipette from multi-channel to single-channel (and visa versa) modifies well selection
  if (
    unsavedForm !== null &&
    unsavedForm.pipette &&
    'pipette' in payload.update
  ) {
    const prevPipette = unsavedForm.pipette
    const nextPipette = payload.update.pipette

    const getChannels = (pipetteId: string): PipetteChannels => {
      const pipettes = pipetteSelectors.pipettesById(getState())
      const pipette = pipettes[pipetteId]
      if (!pipette) {
        console.error(`${pipetteId} not found in pipettes, cannot handleFormChange properly`)
        return 1
      }
      return pipette.channels
    }

    if (typeof nextPipette === 'string' && // TODO Ian 2018-05-04 this type check can probably be removed when changeFormInput is typed
      getChannels(prevPipette) === 1 &&
      getChannels(nextPipette) === 8
    ) {
      // single-channel to multi-channel: clear all selected wells
      // to avoid carrying over inaccessible wells

      // steptypes with single set of wells (not source + dest)
      if (unsavedForm.stepType === 'mix') {
        return {
          update: {
            ...payload.update,
            wells: null
          }
        }
      }

      // source + dest well steptypes
      return {
        update: {
          ...payload.update,
          'aspirate_wells': null,
          'dispense_wells': null
        }
      }
    }

    if (typeof nextPipette === 'string' &&
      getChannels(prevPipette) === 8 &&
      getChannels(nextPipette) === 1
    ) {
      // multi-channel to single-channel: convert primary wells to all wells

      // steptypes with single set of wells (not source + dest)
      if (unsavedForm.stepType === 'mix') {
        const labwareId = unsavedForm.labware
        const labwareType = labwareId && labwareIngredSelectors.getLabware(baseState)[labwareId].type

        return {
          update: {
            ...payload.update,
            wells: _getAllWells(unsavedForm.wells, labwareType)
          }
        }
      }

      // source + dest well steptypes
      const sourceLabwareId = unsavedForm['aspirate_labware']
      const destLabwareId = unsavedForm['dispense_labware']

      const sourceLabwareType = sourceLabwareId && labwareIngredSelectors.getLabware(baseState)[sourceLabwareId].type
      const destLabwareType = destLabwareId && labwareIngredSelectors.getLabware(baseState)[destLabwareId].type

      return {
        update: {
          ...payload.update,
          'aspirate_wells': _getAllWells(unsavedForm['aspirate_wells'], sourceLabwareType),
          'dispense_wells': _getAllWells(unsavedForm['dispense_wells'], destLabwareType)
        }
      }
    }
  }

  // fallback, untransformed
  return payload
}

export default handleFormChange
