// @flow
import {createSelector} from 'reselect'
import {sortWells} from '@opentrons/shared-data'
import type {BaseState, Selector} from '../types'
import type {Wells} from '../labware-ingred/types'

const rootSelector = (state: BaseState) => state.wellSelection

const getSelectedWells: Selector<Wells> = createSelector(
  rootSelector,
  state => state.selectedWells.selected
)

const getHighlightedWells: Selector<Wells> = createSelector(
  rootSelector,
  state => state.selectedWells.highlighted
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
