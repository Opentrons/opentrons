import { createSelector } from 'reselect'
import { sortWells } from '@opentrons/shared-data'
import { WellGroup } from '@opentrons/components'
import { BaseState, Selector } from '../types'

const rootSelector = (state: BaseState): BaseState['wellSelection'] =>
  state.wellSelection

export const getSelectedWells: Selector<WellGroup> = createSelector(
  rootSelector,
  state => state.selectedWells.selected
)
export const getHighlightedWells: Selector<WellGroup> = createSelector(
  rootSelector,
  state => state.selectedWells.highlighted
)
export const getSelectedWellNames: Selector<string[]> = createSelector(
  (state: BaseState) => rootSelector(state).selectedWells.selected,
  selectedWells => Object.keys(selectedWells).sort(sortWells)
)
