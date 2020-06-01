// @flow
import { createSelector } from 'reselect'
import forEach from 'lodash/forEach'
import mapValues from 'lodash/mapValues'
import max from 'lodash/max'
import reduce from 'lodash/reduce'

import type { Options } from '@opentrons/components'
import type {
  RootState,
  ContainersState,
  DrillDownLabwareId,
  IngredientsState,
  SelectedContainerId,
  SelectedLiquidGroupState,
} from './reducers'
import type {
  AllIngredGroupFields,
  IngredInputs,
  LiquidGroup,
  OrderedLiquids,
} from './types'
import type { BaseState, MemoizedSelector, Selector } from './../types'

// TODO: Ian 2019-02-15 no RootSlice, use BaseState
type RootSlice = { labwareIngred: RootState }

const rootSelector = (state: RootSlice): RootState => state.labwareIngred

// NOTE: not intended for UI use! Use getLabwareNicknamesById for the string.
const getLabwareNameInfo: MemoizedSelector<ContainersState> = createSelector(
  rootSelector,
  s => s.containers
)

const getLiquidGroupsById = (state: RootSlice): IngredientsState =>
  rootSelector(state).ingredients
const getLiquidsByLabwareId = (state: RootSlice) =>
  rootSelector(state).ingredLocations

const getNextLiquidGroupId: MemoizedSelector<string> = createSelector(
  getLiquidGroupsById,
  ingredGroups =>
    (max(Object.keys(ingredGroups).map(id => parseInt(id))) + 1 || 0).toString()
)

const getLiquidNamesById: MemoizedSelector<{
  [ingredId: string]: string,
}> = createSelector(
  getLiquidGroupsById,
  ingredGroups => mapValues(ingredGroups, (ingred: LiquidGroup) => ingred.name)
)

const getLiquidSelectionOptions: MemoizedSelector<Options> = createSelector(
  getLiquidGroupsById,
  liquidGroupsById => {
    return Object.keys(liquidGroupsById).map(id => ({
      // NOTE: if these fallbacks are used, it's a bug
      name: liquidGroupsById[id]
        ? liquidGroupsById[id].name || `(Unnamed Liquid: ${String(id)})`
        : 'Missing Liquid',
      value: id,
    }))
  }
)

// false or selected slot to add labware to, eg 'A2'
const selectedAddLabwareSlot = (state: BaseState) =>
  rootSelector(state).modeLabwareSelection

const getSavedLabware = (state: BaseState) => rootSelector(state).savedLabware

const getSelectedLabwareId: MemoizedSelector<SelectedContainerId> = createSelector(
  rootSelector,
  rootState => rootState.selectedContainerId
)

const getSelectedLiquidGroupState: MemoizedSelector<SelectedLiquidGroupState> = createSelector(
  rootSelector,
  rootState => rootState.selectedLiquidGroup
)

const getDrillDownLabwareId: MemoizedSelector<DrillDownLabwareId> = createSelector(
  rootSelector,
  rootState => rootState.drillDownLabwareId
)

const allIngredientGroupFields: MemoizedSelector<AllIngredGroupFields> = createSelector(
  getLiquidGroupsById,
  ingreds =>
    reduce<IngredientsState, AllIngredGroupFields>(
      ingreds,
      (
        acc,
        ingredGroup: IngredInputs,
        ingredGroupId
      ): AllIngredGroupFields => ({
        ...acc,
        [ingredGroupId]: ingredGroup,
      }),
      {}
    )
)

const allIngredientNamesIds: MemoizedSelector<OrderedLiquids> = createSelector(
  getLiquidGroupsById,
  ingreds =>
    Object.keys(ingreds).map(ingredId => ({
      ingredientId: ingredId,
      name: ingreds[ingredId].name,
    }))
)

const getLabwareSelectionMode: MemoizedSelector<boolean> = createSelector(
  rootSelector,
  rootState => {
    return rootState.modeLabwareSelection !== false
  }
)

const getLiquidGroupsOnDeck: MemoizedSelector<Array<string>> = createSelector(
  getLiquidsByLabwareId,
  ingredLocationsByLabware => {
    const liquidGroups: Set<string> = new Set()
    forEach(
      ingredLocationsByLabware,
      (byWell: $Values<typeof ingredLocationsByLabware>) =>
        forEach(byWell, (groupContents: $Values<typeof byWell>) => {
          forEach(
            groupContents,
            (
              contents: $Values<typeof groupContents>,
              groupId: $Keys<typeof groupContents>
            ) => {
              if (contents.volume > 0) {
                liquidGroups.add(groupId)
              }
            }
          )
        })
    )
    return [...liquidGroups]
  }
)

const getDeckHasLiquid: Selector<boolean> = createSelector(
  getLiquidGroupsOnDeck,
  liquidGroups => liquidGroups.length > 0
)

// TODO: prune selectors
export const selectors = {
  rootSelector,

  getLiquidGroupsById,
  getLiquidsByLabwareId,
  getLiquidNamesById,
  getLabwareSelectionMode,
  getLabwareNameInfo,
  getLiquidSelectionOptions,
  getLiquidGroupsOnDeck,
  getNextLiquidGroupId,
  getSavedLabware,
  getSelectedLabwareId,
  getSelectedLiquidGroupState,
  getDrillDownLabwareId,

  allIngredientGroupFields,
  allIngredientNamesIds,
  selectedAddLabwareSlot,
  getDeckHasLiquid,
}
