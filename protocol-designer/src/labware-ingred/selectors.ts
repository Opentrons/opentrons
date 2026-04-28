import forEach from 'lodash/forEach'
import mapValues from 'lodash/mapValues'
import max from 'lodash/max'
import reduce from 'lodash/reduce'
import { createSelector } from 'reselect'

import type { Selector } from 'reselect'
import type { DropdownOption } from '@opentrons/components'
import type { CutoutId } from '@opentrons/shared-data'
import type { Ingredient, LabwareLiquidState } from '@opentrons/step-generation'
import type { BaseState, DeckSlot } from './../types'
import type {
  ContainersState,
  DrillDownLabwareId,
  IngredientsState,
  RootState,
  SelectedContainerId,
  SelectedLiquidGroupState,
  SelectedMultipleContainerIds,
} from './reducers'
import type {
  AllIngredGroupFields,
  IngredInputs,
  ZoomedIntoSlotInfoState,
} from './types'

const rootSelector = (state: BaseState): RootState => state.labwareIngred
// NOTE: not intended for UI use! Use getLabwareNicknamesById for the string.
const getLabwareNameInfo: Selector<BaseState, ContainersState> = createSelector(
  rootSelector,
  s => s.containers
)

const getLiquidGroupsById = (state: BaseState): IngredientsState =>
  rootSelector(state).ingredients

const getLiquidsByLabwareId = (state: BaseState): LabwareLiquidState =>
  rootSelector(state).ingredLocations

const getNextLiquidGroupId: Selector<BaseState, string> = createSelector(
  getLiquidGroupsById,
  ingredGroups =>
    // @ts-expect-error(sa, 2021-6-15): this could return undefined
    (max(Object.keys(ingredGroups).map(id => parseInt(id))) + 1 || 0).toString()
)
const getLiquidNamesById: Selector<
  BaseState,
  Record<string, string>
> = createSelector(
  getLiquidGroupsById,
  ingredGroups =>
    mapValues(
      ingredGroups,
      (ingred: Ingredient) => ingred.displayName
    ) as Record<string, string>
)
const getLiquidSelectionOptions: Selector<BaseState, DropdownOption[]> =
  createSelector(getLiquidGroupsById, liquidGroupsById => {
    return Object.keys(liquidGroupsById).map(id => ({
      // NOTE: if these fallbacks are used, it's a bug
      name: liquidGroupsById[id]
        ? liquidGroupsById[id].displayName || `(Unnamed Liquid: ${String(id)})`
        : 'Missing Liquid',
      value: id,
    }))
  })

// false or selected slot to add labware to, eg 'A2'
const selectedAddLabwareSlot = (state: BaseState): DeckSlot | false =>
  rootSelector(state).modeLabwareSelection

const getSelectedLabwareId: Selector<BaseState, SelectedContainerId> =
  createSelector(rootSelector, rootState => rootState.selectedContainerId)

const getMultipleSelectedLabwareIds: Selector<
  BaseState,
  SelectedMultipleContainerIds
> = createSelector(
  rootSelector,
  rootState => rootState.selectedMultipleContainerIds
)

const getSelectedLiquidGroupState: Selector<
  BaseState,
  SelectedLiquidGroupState
> = createSelector(rootSelector, rootState => rootState.selectedLiquidGroup)
const getDrillDownLabwareId: Selector<BaseState, DrillDownLabwareId> =
  createSelector(rootSelector, rootState => rootState.drillDownLabwareId)
const allIngredientGroupFields: Selector<BaseState, AllIngredGroupFields> =
  createSelector(getLiquidGroupsById, ingreds =>
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

const getLabwareSelectionMode: Selector<BaseState, boolean> = createSelector(
  rootSelector,
  rootState => {
    return rootState.modeLabwareSelection !== false
  }
)
const getLiquidGroupsOnDeck: Selector<BaseState, string[]> = createSelector(
  getLiquidsByLabwareId,
  ingredLocationsByLabware => {
    const liquidGroups: Set<string> = new Set()
    forEach(
      ingredLocationsByLabware,
      (
        byWell: (typeof ingredLocationsByLabware)[keyof typeof ingredLocationsByLabware]
      ) =>
        forEach(
          byWell,
          (groupContents: (typeof byWell)[keyof typeof byWell]) => {
            forEach(
              groupContents,
              (
                contents: (typeof groupContents)[keyof typeof groupContents],
                groupId: keyof typeof groupContents
              ) => {
                if (contents.volume > 0) {
                  liquidGroups.add(groupId as string)
                }
              }
            )
          }
        )
    )
    return [...liquidGroups]
  }
)
const getDeckHasLiquid: Selector<BaseState, boolean> = createSelector(
  getLiquidGroupsOnDeck,
  liquidGroups => liquidGroups.length > 0
)
const getLiquidDisplayColors: Selector<
  BaseState,
  Record<string, string>
> = createSelector(
  getLiquidGroupsById,
  // returns liquidGroupId -> color
  liquids =>
    Object.fromEntries(
      Object.values(liquids).map(liquid => [
        liquid.liquidGroupId,
        liquid.displayColor,
      ])
    )
)

const getZoomedInSlotInfo: Selector<BaseState, ZoomedIntoSlotInfoState> =
  createSelector(rootSelector, rootState => rootState.zoomedInSlotInfo)

const getZoomedInSlot: Selector<
  BaseState,
  { slot: DeckSlot | null; cutout: CutoutId | null }
> = createSelector(
  rootSelector,
  rootState => rootState.zoomedInSlotInfo.selectedSlot
)

const getIsNewProtocol: Selector<BaseState, boolean> = createSelector(
  rootSelector,
  rootState => rootState.generateNewProtocol.isNewProtocol
)

// TODO: prune selectors
export const selectors = {
  rootSelector,
  getLiquidsByLabwareId,
  getLiquidNamesById,
  getLabwareSelectionMode,
  getLabwareNameInfo,
  getLiquidSelectionOptions,
  getLiquidGroupsOnDeck,
  getNextLiquidGroupId,
  getSelectedLabwareId,
  getSelectedLabwareIds: getMultipleSelectedLabwareIds,
  getSelectedLiquidGroupState,
  getDrillDownLabwareId,
  allIngredientGroupFields,
  selectedAddLabwareSlot,
  getDeckHasLiquid,
  getLiquidDisplayColors,
  getZoomedInSlotInfo,
  getZoomedInSlot,
  getIsNewProtocol,
}
