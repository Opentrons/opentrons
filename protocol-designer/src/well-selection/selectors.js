// @flow
import { createSelector } from 'reselect'
import { sortWells } from '@opentrons/shared-data'
import type { WellArray } from '@opentrons/components'
import type { BaseState, Selector } from '../types'

const rootSelector = (state: BaseState) => state.wellSelection

const getSelectedWells: Selector<WellArray> = createSelector(
  rootSelector,
  state => Object.keys(state.selectedWells.selected)
)

const getHighlightedWells: Selector<WellArray> = createSelector(
  rootSelector,
  state => Object.keys(state.selectedWells.highlighted)
)

const getSelectedWellNames: Selector<Array<string>> = createSelector(
  (state: BaseState) => rootSelector(state).selectedWells.selected,
  selectedWells => Object.keys(selectedWells).sort(sortWells)
)

export default {
  getSelectedWellNames,
  getSelectedWells,
  getHighlightedWells,
}
