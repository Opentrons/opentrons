// @flow
import {createSelector} from 'reselect'
import type {BaseState, Selector} from '../types'

const rootSelector = (state: BaseState) => state.wellSelection

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

const getSelectedWells = (state: BaseState) => rootSelector(state).selectedWells

const numWellsSelected: Selector<number> = createSelector(
  getSelectedWells,
  selectedWells => Object.keys(selectedWells.selected).length
)

const getHighlightedWells = (state: BaseState) => rootSelector(state).highlightedIngredients.wells

const wellSelectionModalData: Selector<*> = createSelector(
  rootSelector,
  s => s.wellSelectionModal
)

export default {
  selectedWellNames,
  numWellsSelected,
  getSelectedWells,
  getHighlightedWells,
  wellSelectionModalData
}
