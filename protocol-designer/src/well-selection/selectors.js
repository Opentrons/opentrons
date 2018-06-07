// @flow
import {createSelector} from 'reselect'
import reduce from 'lodash/reduce'
import {wellSetToWellObj} from './utils'
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
    ...wellSetToWellObj(computeWellAccess(labwareName, well))
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
  // TODO LATER Ian 2018-04-19 this will do different sort orders
  // depending on selected well ordering (row-wise R2L top to bottom, etc)
  // PS don't forget multi-letter wells like 'AA11' (1536-well)
  selectedWells => Object.keys(selectedWells).sort((a, b) => {
    function parseWell (well: string): ([string, number]) {
      const letterMatches = well.match(/\D+/)
      const numberMatches = well.match(/\d+/)

      return [
        (letterMatches && letterMatches[0]) || '',
        (numberMatches && numberMatches[0] && parseInt(numberMatches[0])) || NaN
      ]
    }

    const [letterA, numberA] = parseWell(a)
    const [letterB, numberB] = parseWell(b)

    // this sort is top to bottom (down column), then left to right (across row)
    if (numberA !== numberB) {
      return (numberA > numberB) ? 1 : -1
    }

    if (letterA.length !== letterB.length) {
      // Eg 'B' vs 'AA'
      return (letterA.length > letterB.length) ? 1 : -1
    }

    return (letterA > letterB) ? 1 : -1
  })
)

export default {
  selectedWellNames,
  getSelectedWells,
  getHighlightedWells,
  wellSelectionModalData
}
