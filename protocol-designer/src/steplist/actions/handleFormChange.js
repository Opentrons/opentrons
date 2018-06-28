// @flow
import uniq from 'lodash/uniq'
import {getWellSetForMultichannel} from '../../well-selection/utils'

import {selectors} from '../index'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
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
    'aspirate--labware' in payload.update
  ) {
    return {
      update: {
        ...payload.update,
        'aspirate--wells': null
      }
    }
  }

  // Changing labware clears wells selection: dest labware
  if (
    unsavedForm !== null &&
    'dispense--labware' in payload.update
  ) {
    return {
      update: {
        ...payload.update,
        'dispense--wells': null
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
        'wells': null
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

    const getChannels = (pipetteId: string): 1 | 8 => {
      // TODO HACK Ian 2018-05-04 use pipette definitions for this;
      // you'd also need a way to grab pipette model from a given pipetteId here
      return pipetteId.endsWith('8-Channel') ? 8 : 1
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
          'aspirate--wells': null,
          'dispense--wells': null
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
      const sourceLabwareId = unsavedForm['aspirate--labware']
      const destLabwareId = unsavedForm['dispense--labware']

      const sourceLabwareType = sourceLabwareId && labwareIngredSelectors.getLabware(baseState)[sourceLabwareId].type
      const destLabwareType = destLabwareId && labwareIngredSelectors.getLabware(baseState)[destLabwareId].type

      return {
        update: {
          ...payload.update,
          'aspirate--wells': _getAllWells(unsavedForm['aspirate--wells'], sourceLabwareType),
          'dispense--wells': _getAllWells(unsavedForm['dispense--wells'], destLabwareType)
        }
      }
    }
  }

  // fallback, untransformed
  return payload
}

export default handleFormChange
