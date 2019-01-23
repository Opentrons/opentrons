// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'
import omit from 'lodash/omit'
import mapValues from 'lodash/mapValues'
import pickBy from 'lodash/pickBy'
import reduce from 'lodash/reduce'

import * as actions from '../actions'
import {_loadedContainersBySlot} from '../utils'
import {sortedSlotnames, FIXED_TRASH_ID} from '../../constants'
import {getPDMetadata} from '../../file-types'
import type {DeckSlot} from '@opentrons/components'
import type {SingleLabwareLiquidState, LabwareLiquidState} from '../../step-generation'
import type {LiquidGroupsById, Labware} from '../types'
import type {LoadFileAction} from '../../load-file'
import type {
  RemoveWellsContents,
  DeleteLiquidGroup,
  DuplicateLabwareAction,
  EditLiquidGroupAction,
  SwapSlotContentsAction,
  SelectLiquidAction,
  SetWellContentsAction,
} from '../actions'

// external actions (for types)
import typeof {openWellSelectionModal} from '../../well-selection/actions'

// UTILS
const nextEmptySlot = loadedContainersSubstate => {
  // Next empty slot in the sorted slotnames order. Or null if no more slots.
  const nextEmptySlotIdx = sortedSlotnames.findIndex(slot => !(slot in loadedContainersSubstate))
  const result = nextEmptySlotIdx >= sortedSlotnames.length ? null : sortedSlotnames[nextEmptySlotIdx]
  return result
}

// REDUCERS

// modeLabwareSelection: boolean. If true, we're selecting labware to add to a slot
// (this state just toggles a modal)
const modeLabwareSelection = handleActions({
  OPEN_ADD_LABWARE_MODAL: (state, action: ActionType<typeof actions.openAddLabwareModal>) =>
    action.payload.slot,
  CLOSE_LABWARE_SELECTOR: () => false,
  CREATE_CONTAINER: () => false,
}, false)

export type SelectedContainerId = ?string
const selectedContainerId = handleActions({
  OPEN_INGREDIENT_SELECTOR: (state, action: ActionType<typeof actions.openIngredientSelector>): SelectedContainerId => action.payload,
  CLOSE_INGREDIENT_SELECTOR: (state, action: ActionType<typeof actions.closeIngredientSelector>): SelectedContainerId => null,

  // $FlowFixMe: Cannot get `action.payload` because property `payload` is missing in function
  OPEN_WELL_SELECTION_MODAL: (state, action: ActionType<openWellSelectionModal>): SelectedContainerId =>
    action.payload.labwareId,
  CLOSE_WELL_SELECTION_MODAL: (): SelectedContainerId => null,
}, null)

export type DrillDownLabwareId = ?string
const drillDownLabwareId = handleActions({
  DRILL_DOWN_ON_LABWARE: (state, action: ActionType<typeof actions.drillDownOnLabware>): DrillDownLabwareId => action.payload,
  DRILL_UP_FROM_LABWARE: (state, action: ActionType<typeof actions.drillUpFromLabware>): DrillDownLabwareId => null,
}, null)

export type ContainersState = {
  [id: string]: ?Labware,
}

export type SelectedLiquidGroupState = {liquidGroupId: ?string, newLiquidGroup?: true}
const unselectedLiquidGroupState = {liquidGroupId: null}
// This is only a concern of the liquid page.
// null = nothing selected, newLiquidGroup: true means user is creating new liquid
const selectedLiquidGroup = handleActions({
  SELECT_LIQUID_GROUP: (state: SelectedLiquidGroupState, action: SelectLiquidAction): SelectedLiquidGroupState =>
    ({liquidGroupId: action.payload}),
  DELETE_LIQUID_GROUP: () => unselectedLiquidGroupState,
  DESELECT_LIQUID_GROUP: () => unselectedLiquidGroupState,
  CREATE_NEW_LIQUID_GROUP_FORM: (): SelectedLiquidGroupState =>
    ({liquidGroupId: null, newLiquidGroup: true}),
  EDIT_LIQUID_GROUP: () => unselectedLiquidGroupState, // clear on form save
}, unselectedLiquidGroupState)

const initialLabwareState: ContainersState = {
  [FIXED_TRASH_ID]: {
    id: FIXED_TRASH_ID,
    type: 'fixed-trash',
    disambiguationNumber: 1,
    nickname: 'Trash',
    slot: '12',
  },
}

function getNextDisambiguationNumber (allLabwareById: ContainersState, labwareType: string): number {
  const allIds = Object.keys(allLabwareById)
  const sameTypeLabware = allIds.filter(labwareId =>
    allLabwareById[labwareId] &&
    allLabwareById[labwareId].type === labwareType)
  const disambigNumbers = sameTypeLabware.map(labwareId =>
    (allLabwareById[labwareId] &&
    allLabwareById[labwareId].disambiguationNumber) || 0)

  return disambigNumbers.length > 0
    ? Math.max(...disambigNumbers) + 1
    : 1
}

export const containers = handleActions({
  CREATE_CONTAINER: (state: ContainersState, action: ActionType<typeof actions.createContainer>) => {
    const id = action.payload.id
    return {
      ...state,
      [id]: {
        slot: action.payload.slot || nextEmptySlot(_loadedContainersBySlot(state)),
        type: action.payload.containerType,
        disambiguationNumber: getNextDisambiguationNumber(state, action.payload.containerType),
        id,
        nickname: null, // create with null name, so we force explicit naming.
      },
    }
  },
  DELETE_CONTAINER: (state: ContainersState, action: ActionType<typeof actions.deleteContainer>) => pickBy(
    state,
    (value: Labware, key: string) => key !== action.payload.containerId
  ),
  RENAME_LABWARE: (state: ContainersState, action: ActionType<typeof actions.renameLabware>) => {
    const {labwareId, name} = action.payload
    // ignore renaming to whitespace
    return (name && name.trim())
      ? {
        ...state,
        [labwareId]: {
          ...state[labwareId],
          nickname: name,
        },
      }
      : state
  },
  SWAP_SLOT_CONTENTS: (state: ContainersState, action: SwapSlotContentsAction): ContainersState => {
    const { sourceSlot, destSlot } = action.payload
    const fromLabware = reduce(state, (acc, container, id) => (
      container.slot === destSlot ? {...acc, [id]: {...container, slot: sourceSlot}} : acc
    ), {})
    const toLabware = reduce(state, (acc, container, id) => (
      container.slot === sourceSlot ? {...acc, [id]: {...container, slot: destSlot}} : acc
    ), {})
    return {
      ...state,
      ...fromLabware,
      ...toLabware,
    }
  },
  DUPLICATE_LABWARE: (state: ContainersState, action: DuplicateLabwareAction): ContainersState => {
    const {templateLabwareId, duplicateLabwareId} = action.payload
    const templateLabware = state[templateLabwareId]
    const nextSlot = nextEmptySlot(_loadedContainersBySlot(state))
    if (!nextSlot || !templateLabware) return state
    return {
      ...state,
      [duplicateLabwareId]: {
        slot: nextSlot,
        type: templateLabware.type,
        disambiguationNumber: getNextDisambiguationNumber(state, templateLabware.type),
        id: duplicateLabwareId,
        name: null, // create with null name, so we force explicit naming.
      },
    }
  },
  LOAD_FILE: (state: ContainersState, action: LoadFileAction): ContainersState => {
    const file = action.payload
    const allFileLabware = file.labware
    const labwareIds: Array<string> = Object.keys(allFileLabware).sort((a, b) =>
      Number(allFileLabware[a].slot) - Number(allFileLabware[b].slot))

    return labwareIds.reduce((acc: ContainersState, id): ContainersState => {
      const fileLabware = allFileLabware[id]
      return {
        ...acc,
        [id]: {
          slot: fileLabware.slot,
          id,
          type: fileLabware.model,
          nickname: fileLabware['display-name'],
          disambiguationNumber: getNextDisambiguationNumber(acc, fileLabware.model),
        },
      }
    }, {})
  },
}, initialLabwareState)

type SavedLabwareState = {[labwareId: string]: boolean}
/** Keeps track of which labware have saved nicknames */
export const savedLabware = handleActions({
  DELETE_CONTAINER: (state: SavedLabwareState, action: ActionType<typeof actions.deleteContainer>) => ({
    ...state,
    [action.payload.containerId]: false,
  }),
  RENAME_LABWARE: (state: SavedLabwareState, action: ActionType<typeof actions.renameLabware>) => ({
    ...state,
    [action.payload.labwareId]: true,
  }),
  DUPLICATE_LABWARE: (state: SavedLabwareState, action: DuplicateLabwareAction) => ({
    ...state,
    [action.payload.duplicateLabwareId]: true,
  }),
  LOAD_FILE: (state: SavedLabwareState, action: LoadFileAction): SavedLabwareState => (
    mapValues(action.payload.labware, () => true)
  ),
}, {})

type IngredientsState = LiquidGroupsById
export const ingredients = handleActions({
  EDIT_LIQUID_GROUP: (state: IngredientsState, action: EditLiquidGroupAction): IngredientsState => {
    const {liquidGroupId} = action.payload
    return {
      ...state,
      [liquidGroupId]: {...state[liquidGroupId], ...action.payload},
    }
  },
  DELETE_LIQUID_GROUP: (state: IngredientsState, action: DeleteLiquidGroup): IngredientsState => {
    const liquidGroupId = action.payload
    return omit(state, liquidGroupId)
  },
  LOAD_FILE: (state: IngredientsState, action: LoadFileAction): IngredientsState =>
    getPDMetadata(action.payload).ingredients,
}, {})

type LocationsState = LabwareLiquidState

export const ingredLocations = handleActions({
  SET_WELL_CONTENTS: (state: LocationsState, action: SetWellContentsAction): LocationsState => {
    const {liquidGroupId, labwareId, wells, volume} = action.payload
    const newWellContents = {[liquidGroupId]: {volume}}
    const updatedWells = wells.reduce((acc, wellName): SingleLabwareLiquidState => ({
      ...acc,
      [wellName]: newWellContents,
    }), {})

    return {
      ...state,
      [labwareId]: {
        ...state[labwareId],
        ...updatedWells,
      },
    }
  },
  DUPLICATE_LABWARE: (state: LocationsState, action: DuplicateLabwareAction): LocationsState => {
    const {templateLabwareId, duplicateLabwareId} = action.payload
    return {
      ...state,
      [duplicateLabwareId]: {
        ...state[templateLabwareId],
      },
    }
  },
  REMOVE_WELLS_CONTENTS: (state: LocationsState, action: RemoveWellsContents): LocationsState => {
    const {wells, labwareId} = action.payload
    return {
      ...state,
      [labwareId]: {
        ...omit(state[labwareId], wells),
      },
    }
  },
  DELETE_LIQUID_GROUP: (state: LocationsState, action: DeleteLiquidGroup): LocationsState => {
    const liquidGroupId = action.payload
    return mapValues(state, labwareContents =>
      mapValues(labwareContents, well =>
        omit(well, liquidGroupId)))
  },
  DELETE_CONTAINER: (
    state: LocationsState,
    action: ActionType<typeof actions.deleteContainer>
  ): LocationsState =>
    omit(state, action.payload.containerId),
  LOAD_FILE: (state: LocationsState, action: LoadFileAction): LocationsState =>
    getPDMetadata(action.payload).ingredLocations,
}, {})

export type RootState = {|
  modeLabwareSelection: ?DeckSlot,
  selectedContainerId: SelectedContainerId,
  drillDownLabwareId: DrillDownLabwareId,
  containers: ContainersState,
  savedLabware: SavedLabwareState,
  selectedLiquidGroup: SelectedLiquidGroupState,
  ingredients: IngredientsState,
  ingredLocations: LocationsState,
|}

// TODO Ian 2018-01-15 factor into separate files
const rootReducer = combineReducers({
  modeLabwareSelection,
  selectedContainerId,
  selectedLiquidGroup,
  drillDownLabwareId,
  containers,
  savedLabware,
  ingredients,
  ingredLocations,
})

export default rootReducer
