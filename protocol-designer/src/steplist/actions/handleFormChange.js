// @flow
import {getWellSetForMultichannel} from '../../well-selection/utils'

import {selectors} from '../reducers'
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

  return allWells
}

function handleFormChange (payload: ChangeFormPayload, getState: GetState): ChangeFormPayload {
  // Use state to handle form changes
  const baseState = getState()
  const unsavedForm = selectors.formData(baseState)

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

    if (nextPipette === 'string' && // TODO Ian 2018-05-04 this type check can probably be removed when changeFormInput is typed
      getChannels(nextPipette) === 8 &&
      getChannels(prevPipette) === 1
    ) {
      // multi-channel to single-channel: clear all selected wells
      // to avoid carrying over inaccessible wells
      return {
        update: {
          pipette: nextPipette,
          'aspirate--wells': [],
          'dispense--wells': []
        }
      }
    }

    if (typeof nextPipette === 'string' &&
      getChannels(nextPipette) === 1 &&
      getChannels(prevPipette) === 8
    ) {
      // single-channel to multi-channel: convert primary wells to all wells
      const sourceLabwareId = unsavedForm['aspirate--labware']
      const destLabwareId = unsavedForm['dispense--labware']

      const sourceLabwareType = sourceLabwareId && labwareIngredSelectors.getLabware(baseState)[sourceLabwareId].type
      const destLabwareType = destLabwareId && labwareIngredSelectors.getLabware(baseState)[destLabwareId].type

      return {
        update: {
          pipette: nextPipette,
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
