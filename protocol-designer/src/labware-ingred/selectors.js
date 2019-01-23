// @flow
import {createSelector} from 'reselect'
import forEach from 'lodash/forEach'
import mapValues from 'lodash/mapValues'
import max from 'lodash/max'
import reduce from 'lodash/reduce'

import {_loadedContainersBySlot, labwareToDisplayName} from './utils'
import {getIsTiprack} from '@opentrons/shared-data'
import type {DeckSlot} from '@opentrons/components'
import type {
  RootState,
  DrillDownLabwareId,
  SelectedContainerId,
  SelectedLiquidGroupState,
} from './reducers'
import type {
  AllIngredGroupFields,
  IngredInputs,
  Labware,
  LabwareTypeById,
  LiquidGroup,
  OrderedLiquids,
} from './types'
import type {BaseState, Options} from './../types'

type Selector<T> = (RootSlice) => T
type RootSlice = {labwareIngred: RootState}

const rootSelector = (state: RootSlice): RootState => state.labwareIngred

const getLabwareById: Selector<{[labwareId: string]: ?Labware}> = createSelector(
  rootSelector,
  rootState => rootState.containers
)

const getLabwareNicknamesById: Selector<{[labwareId: string]: string}> = createSelector(
  getLabwareById,
  (labwareById) => mapValues(
    labwareById,
    labwareToDisplayName,
  )
)

const getLabwareTypes: Selector<LabwareTypeById> = createSelector(
  getLabwareById,
  (labwareById) => mapValues(
    labwareById,
    (labware: Labware) => labware.type
  )
)

const getLiquidGroupsById = (state: RootSlice) => rootSelector(state).ingredients
const getLiquidsByLabwareId = (state: RootSlice) => rootSelector(state).ingredLocations

const getNextLiquidGroupId: Selector<string> = createSelector(
  getLiquidGroupsById,
  (ingredGroups) => ((max(Object.keys(ingredGroups).map(id => parseInt(id))) + 1) || 0).toString()
)

const getLiquidNamesById: Selector<{[ingredId: string]: string}> = createSelector(
  getLiquidGroupsById,
  ingredGroups => mapValues(ingredGroups, (ingred: LiquidGroup) => ingred.name)
)

const getLiquidSelectionOptions: Selector<Options> = createSelector(
  getLiquidGroupsById,
  (liquidGroupsById) => {
    return Object.keys(liquidGroupsById).map(id => ({
      // NOTE: if these fallbacks are used, it's a bug
      name: (liquidGroupsById[id])
        ? liquidGroupsById[id].name || `(Unnamed Liquid: ${String(id)})`
        : 'Missing Liquid',
      value: id,
    }))
  }
)

const loadedContainersBySlot = createSelector(
  getLabwareById,
  containers => _loadedContainersBySlot(containers)
)

/** Returns options for dropdowns, excluding tiprack labware */
const labwareOptions: Selector<Options> = createSelector(
  getLabwareById,
  getLabwareNicknamesById,
  (labwareById, names) => reduce(labwareById, (acc: Options, labware: Labware, labwareId): Options => {
    const isTiprack = getIsTiprack(labware.type)
    if (!labware.type || isTiprack) {
      return acc
    }
    return [
      ...acc,
      {
        name: names[labwareId],
        value: labwareId,
      },
    ]
  }, [])
)

const DISPOSAL_LABWARE_TYPES = ['trash-box', 'fixed-trash']
/** Returns options for disposal (e.g. fixed trash and trash box) */
const disposalLabwareOptions: Selector<Options> = createSelector(
  getLabwareById,
  getLabwareNicknamesById,
  (labwareById, names) => reduce(labwareById, (acc: Options, labware: Labware, labwareId): Options => {
    if (!labware.type || !DISPOSAL_LABWARE_TYPES.includes(labware.type)) {
      return acc
    }
    return [
      ...acc,
      {
        name: names[labwareId],
        value: labwareId,
      },
    ]
  }, [])
)

// false or selected slot to add labware to, eg 'A2'
const selectedAddLabwareSlot = (state: BaseState) => rootSelector(state).modeLabwareSelection

const getSavedLabware = (state: BaseState) => rootSelector(state).savedLabware

const getSelectedLabwareId: Selector<SelectedContainerId> = createSelector(
  rootSelector,
  rootState => rootState.selectedContainerId
)

const getSelectedLiquidGroupState: Selector<SelectedLiquidGroupState> = createSelector(
  rootSelector,
  rootState => rootState.selectedLiquidGroup
)

const getSelectedLabware: Selector<?Labware> = createSelector(
  getSelectedLabwareId,
  getLabwareById,
  (selectedLabwareId, labware) =>
    (selectedLabwareId && labware[selectedLabwareId]) || null
)

const getDrillDownLabwareId: Selector<DrillDownLabwareId> = createSelector(
  rootSelector,
  rootState => rootState.drillDownLabwareId
)

type ContainersBySlot = { [DeckSlot]: {...Labware, containerId: string} }

const containersBySlot: Selector<ContainersBySlot> = createSelector(
  getLabwareById,
  containers => reduce(
    containers,
    (acc: ContainersBySlot, containerObj: Labware, containerId: string) => ({
      ...acc,
      // NOTE: containerId added in so you still have a reference
      [containerObj.slot]: {...containerObj, containerId},
    }),
    {})
)

// TODO Ian 2018-07-06 consolidate into types.js
type IngredGroupFields = {
  [ingredGroupId: string]: {
    groupId: string,
    ...$Exact<IngredInputs>,
  },
}
const allIngredientGroupFields: Selector<AllIngredGroupFields> = createSelector(
  getLiquidGroupsById,
  (ingreds) => reduce(
    ingreds,
    (acc: IngredGroupFields, ingredGroup: IngredGroupFields, ingredGroupId: string) => ({
      ...acc,
      [ingredGroupId]: ingredGroup,
    }), {})
)

const allIngredientNamesIds: BaseState => OrderedLiquids = createSelector(
  getLiquidGroupsById,
  ingreds => Object.keys(ingreds).map(ingredId =>
    ({ingredientId: ingredId, name: ingreds[ingredId].name}))
)

const getLabwareSelectionMode: Selector<boolean> = createSelector(
  rootSelector,
  (rootState) => {
    return rootState.modeLabwareSelection !== false
  }
)

const getLiquidGroupsOnDeck: Selector<Array<string>> = createSelector(
  getLiquidsByLabwareId,
  (ingredLocationsByLabware) => {
    let liquidGroups: Set<string> = new Set()
    forEach(ingredLocationsByLabware, (byWell: $Values<typeof ingredLocationsByLabware>) =>
      forEach(byWell, (groupContents: $Values<typeof byWell>) => {
        forEach(groupContents, (contents: $Values<typeof groupContents>, groupId: $Keys<typeof groupContents>) => {
          if (contents.volume > 0) {
            liquidGroups.add(groupId)
          }
        })
      })
    )
    return [...liquidGroups]
  }
)

const getDeckHasLiquid: Selector<boolean> = createSelector(
  getLiquidGroupsOnDeck,
  (liquidGroups) => liquidGroups.length > 0
)

// TODO: prune selectors
export const selectors = {
  rootSelector,

  getLiquidGroupsById,
  getLiquidsByLabwareId,
  getLiquidNamesById,
  getLabwareById,
  getLabwareNicknamesById,
  getLabwareSelectionMode,
  getLabwareTypes,
  getLiquidSelectionOptions,
  getLiquidGroupsOnDeck,
  getNextLiquidGroupId,
  getSavedLabware,
  getSelectedLabware,
  getSelectedLabwareId,
  getSelectedLiquidGroupState,
  getDrillDownLabwareId,

  allIngredientGroupFields,
  allIngredientNamesIds,
  loadedContainersBySlot,
  containersBySlot,
  selectedAddLabwareSlot,
  disposalLabwareOptions,
  labwareOptions,
  getDeckHasLiquid,
}
