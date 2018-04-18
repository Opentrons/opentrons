// @flow
import {createSelector} from 'reselect'
import type {BaseState, Selector} from '../types'

const rootSelector = (state: BaseState) => state.wellSelection

const selectedWellNames: Selector<Array<string>> = createSelector(
  (state: BaseState) => rootSelector(state).selectedWells.selected,
  selectedWells => Object.keys(selectedWells)
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
