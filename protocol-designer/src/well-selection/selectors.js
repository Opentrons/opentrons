// @flow
import {createSelector} from 'reselect'
import reduce from 'lodash/reduce'
import {wellSetToWellObj} from './utils'
import {sortWells} from '../utils'
import {computeWellAccess} from '@opentrons/shared-data'
import type {BaseState, Selector} from '../types'
import type {Wells} from '../labware-ingred/types'
import type {OpenWellSelectionModalPayload} from './actions'

const rootSelector = (state: BaseState) => state.wellSelection

const wellSelectionModalData: Selector<?OpenWellSelectionModalPayload> = createSelector(
  rootSelector,
  s => s.wellSelectionModal
)

const getSelectedPrimaryWells: Selector<Wells> = createSelector(
  rootSelector,
  state => state.selectedWells.selected
)

const getHighlightedPrimaryWells: Selector<Wells> = createSelector(
  rootSelector,
  state => state.selectedWells.highlighted
)

function _primaryToAllWells (
  wells: Wells,
  _wellSelectionModalData: ?OpenWellSelectionModalPayload
): Wells {
  const {labwareName = null, pipetteChannels = null} = _wellSelectionModalData || {}
  if (!labwareName || pipetteChannels !== 8) {
    // single-channel or ingredient selection
    return wells
  }

  if (!labwareName) {
    console.warn('Expected labwareName from well selection modal data')
    return {}
  }

  return reduce(wells, (acc: Wells, well: string): Wells => ({
    ...acc,
    ...wellSetToWellObj(computeWellAccess(labwareName, well)),
  }), {})
}

const getSelectedWells: Selector<Wells> = createSelector(
  getSelectedPrimaryWells,
  wellSelectionModalData,
  _primaryToAllWells
)

const getHighlightedWells: Selector<Wells> = createSelector(
  getHighlightedPrimaryWells,
  wellSelectionModalData,
  _primaryToAllWells
)

const selectedWellNames: Selector<Array<string>> = createSelector(
  (state: BaseState) => rootSelector(state).selectedWells.selected,
  selectedWells => Object.keys(selectedWells).sort(sortWells)
)

export default {
  selectedWellNames,
  getSelectedWells,
  getHighlightedWells,
  wellSelectionModalData,
}
