// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'
import {createSelector} from 'reselect'

import omit from 'lodash/omit'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import reduce from 'lodash/reduce'

import {sortedSlotnames, FIXED_TRASH_ID} from '../../constants.js'
import {uuid} from '../../utils.js'

import type {DeckSlot} from '@opentrons/components'

import {
  editableIngredFields,
  persistedIngredFields
} from '../types'

import type {
  IngredInputFields,
  AllIngredGroupFields,
  Labware,
  Wells,
  IngredsForLabware,
  IngredsForAllLabware,
  IngredInstance
} from '../types'
import * as actions from '../actions'
import type {BaseState, Selector} from '../../types'
import type {CopyLabware, DeleteIngredient, EditIngredient} from '../actions'

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
  OPEN_LABWARE_SELECTOR: (state, action: ActionType<typeof actions.openLabwareSelector>) =>
      action.payload.slot,
  CLOSE_LABWARE_SELECTOR: () => false,
  CREATE_CONTAINER: () => false
}, false)

// If falsey, we aren't copying labware. Else, value should be the containerID we're
// ready to copy.
const copyLabwareMode = handleActions({
  SET_COPY_LABWARE_MODE: (state, action: ActionType<typeof actions.setCopyLabwareMode>) => action.payload,
  COPY_LABWARE: (state, action: CopyLabware) => false // leave copy mode after performing a copy action
}, false)

type SelectedContainerId = string | null
const selectedContainerId = handleActions({
  OPEN_INGREDIENT_SELECTOR: (state, action: ActionType<typeof actions.openIngredientSelector>): SelectedContainerId => action.payload,
  CLOSE_INGREDIENT_SELECTOR: (state, action: ActionType<typeof actions.closeIngredientSelector>): SelectedContainerId => null,

  OPEN_WELL_SELECTION_MODAL: (state, action: ActionType<openWellSelectionModal>): SelectedContainerId => action.payload.labwareId,
  CLOSE_WELL_SELECTION_MODAL: (): SelectedContainerId => null
}, null)

type SelectedIngredientGroupState = {|
  groupId: string,
  wellName: string
|} | null

const selectedIngredientGroup = handleActions({
  // selected ingredient group to edit
  // TODO: SelectedIngredientGroupState is type of payload, type the action though
  EDIT_MODE_INGREDIENT_GROUP: (state, action: ActionType<typeof actions.editModeIngredientGroup>) =>
    action.payload,
  OPEN_INGREDIENT_SELECTOR: () => null,
  EDIT_INGREDIENT: () => null, // unselect ingredient group when edited.
  DELETE_INGREDIENT: () => null, // unselect ingredient group when deleted.
  CLOSE_INGREDIENT_SELECTOR: () => null
}, null)

type ContainersState = {
  [id: string]: Labware
}

const initialLabwareState: ContainersState = {
  [FIXED_TRASH_ID]: {
    id: FIXED_TRASH_ID,
    disambiguationNumber: 1,
    type: 'trash-box', // TODO Ian 2018-03-23 Change to 'fixed-trash' using new defs
    name: 'Trash',
    slot: '12'
  }
}

function getNextDisambiguationNumber (allContainers: ContainersState, labwareType: string): number {
  const allIds = Object.keys(allContainers)
  const sameTypeLabware = allIds.filter(containerId => allContainers[containerId].type === labwareType)
  const disambigNumbers = sameTypeLabware.map(containerId => allContainers[containerId].disambiguationNumber)
  return Math.max(...disambigNumbers)
}

export const containers = handleActions({
  CREATE_CONTAINER: (state: ContainersState, action: ActionType<typeof actions.createContainer>) => {
    const id = uuid() + ':' + action.payload.containerType
    return {
      ...state,
      [id]: {
        slot: action.payload.slot || nextEmptySlot(_loadedContainersBySlot(state)),
        type: action.payload.containerType,
        disambiguationNumber: getNextDisambiguationNumber(state, action.payload.containerType),
        id,
        name: null // create with null name, so we force explicit naming.
      }
    }
  },
  DELETE_CONTAINER: (state: ContainersState, action: ActionType<typeof actions.deleteContainer>) => pickBy(
    state,
    (value: Labware, key: string) => key !== action.payload.containerId
  ),
  MODIFY_CONTAINER: (state: ContainersState, action: ActionType<typeof actions.modifyContainer>) => {
    const { containerId, modify } = action.payload
    return {...state, [containerId]: {...state[containerId], ...modify}}
  },
  COPY_LABWARE: (state: ContainersState, action: CopyLabware) => {
    const { fromContainer, toContainer, toSlot } = action.payload
    return {...state, [toContainer]: {...state[fromContainer], slot: toSlot}}
  }
},
initialLabwareState)

type IngredientsState = {
  [ingredGroupId: string]: IngredInputFields
}
export const ingredients = handleActions({
  EDIT_INGREDIENT: (state, action: EditIngredient) => {
    const { groupId, isUnchangedClone } = action.payload
    if (!(groupId in state)) {
      // is a new ingredient
      return {
        ...state,
        [groupId]: pick(action.payload, persistedIngredFields)
      }
    }

    if (isUnchangedClone) {
      // for an unchanged clone, do nothing
      return state
    }

    // otherwise, create a new ingredient group
    return {
      ...state,
      [groupId]: {
        ...pick(action.payload, persistedIngredFields)
      }
    }
  },
  // Remove the deleted group (referenced by array index)
  DELETE_INGREDIENT: (state, action: DeleteIngredient) => {
    const {groupId, wellName} = action.payload
    return (wellName)
      // if wellName included, only a single well is being delete. not the whole group. Only ingredLocations change.
      ? state
      // otherwise, the whole ingred group is deleted
      : omit(state, [groupId])
  }
}, {})

type LocationsState = {
  [ingredGroupId: string]: IngredInstance
}

export const ingredLocations = handleActions({
  EDIT_INGREDIENT: (state: LocationsState, action: EditIngredient) => {
    const { groupId, containerId, isUnchangedClone } = action.payload

    function wellsWithVol (acc, well) {
      return {
        ...acc,
        [well]: {
          volume: action.payload.volume
        }
      }
    }

    if (isUnchangedClone) {
      // for an unchanged clone, just add the new wells.
      return {
        ...state,
        [groupId]: {
          ...state[groupId],
          [containerId]: {
            ...state[groupId][containerId],
            ...action.payload.wells.reduce(wellsWithVol, {})
          }
        }
      }
    }

    return {
      ...state,
      [groupId]: {
        [containerId]: action.payload.wells.reduce(wellsWithVol, {})
      }
    }
  },
  DELETE_INGREDIENT: (state: LocationsState, action: DeleteIngredient) => {
    const { wellName, groupId, containerId } = action.payload
    if (wellName) {
      // deleting single well location
      return {
        ...state,
        [groupId]: {
          ...state[groupId],
          [containerId]: pickBy(
            state[groupId][containerId],
            (wellData: *, wellKey: string) => wellKey !== wellName
          )
        }
      }
    }
    // deleting entire ingred group
    return omit(state, [groupId])
  },
  COPY_LABWARE: (state: LocationsState, action: CopyLabware) => {
    const {fromContainer, toContainer} = action.payload
    return reduce(state, (acc, ingredLocations: {[containerId: string]: Wells}, ingredId) => {
      return {
        ...acc,
        [ingredId]: (state[ingredId] && state[ingredId][fromContainer])
          ? {
            ...ingredLocations,
            [toContainer]: state[ingredId][fromContainer]
          }
          : ingredLocations
      }
    }, {})
  }
}, {})

export type RootState = {|
  modeLabwareSelection: string | false, // TODO use null, not false
  copyLabwareMode: string | false,
  selectedContainerId: SelectedContainerId,
  selectedIngredientGroup: SelectedIngredientGroupState,
  containers: ContainersState,
  ingredients: IngredientsState,
  ingredLocations: LocationsState
|}

// TODO Ian 2018-01-15 factor into separate files
const rootReducer = combineReducers({
  modeLabwareSelection,
  copyLabwareMode,
  selectedContainerId,
  selectedIngredientGroup,
  containers,
  ingredients,
  ingredLocations
})

// SELECTORS
const rootSelector = (state: BaseState): RootState => state.labwareIngred

const getLabware: Selector<{[labwareId: string]: Labware}> = createSelector(
  rootSelector,
  rootState => rootState.containers
)

const getIngredientGroups = (state: BaseState) => rootSelector(state).ingredients
const getIngredientLocations = (state: BaseState) => rootSelector(state).ingredLocations

const _loadedContainersBySlot = (containers: ContainersState) =>
  reduce(containers, (acc, container: Labware, containerId) => (container.slot)
    ? {...acc, [container.slot]: container.type}
    : acc
  , {})

const loadedContainersBySlot = createSelector(
  getLabware,
  containers => _loadedContainersBySlot(containers)
)

/** Returns options for dropdowns, excluding tiprack labware */
const labwareOptions: (state: BaseState) => Array<{value: string, name: string}> = createSelector(
  getLabware,
  containers => reduce(containers, (acc, containerFields: Labware, containerId) => {
    // TODO Ian 2018-02-16 more robust way to filter out tipracks?
    if (!containerFields.type || containerFields.type.startsWith('tiprack')) {
      return acc
    }
    return [
      ...acc,
      {
        name: containerFields.name || `${containerFields.slot}: ${containerFields.type}`,
        value: containerId
      }
    ]
  }, [])
)

const canAdd = (state: BaseState) => rootSelector(state).modeLabwareSelection // false or selected slot to add labware to, eg 'A2'

const getSelectedContainerId: Selector<SelectedContainerId> = createSelector(
  rootSelector,
  rootState => rootState.selectedContainerId
)

const getSelectedContainer: Selector<?Labware> = createSelector(
  getSelectedContainerId,
  getLabware,
  (_selectedId, _labware) => (_selectedId && _labware[_selectedId]) || null
)

type ContainersBySlot = { [DeckSlot]: {...Labware, containerId: string} }

const containersBySlot: Selector<ContainersBySlot> = createSelector(
  getLabware,
  containers => reduce(
    containers,
    (acc: ContainersBySlot, containerObj: Labware, containerId: string) => ({
      ...acc,
      // NOTE: containerId added in so you still have a reference
      [containerObj.slot]: {...containerObj, containerId}
    }),
    {})
)

const ingredFields = [...editableIngredFields, 'groupId']

// TODO move these to types.js
type IngredGroupField = {
  groupId: string,
  ...IngredInputFields
}

type IngredGroupFields = {
  [ingredGroupId: string]: IngredGroupField
}
const allIngredientGroupFields: BaseState => AllIngredGroupFields = createSelector(
  getIngredientGroups,
  (ingreds) => reduce(
    ingreds,
    (acc: IngredGroupFields, ingredGroup: IngredGroupFields, ingredGroupId: string) => ({
      ...acc,
      [ingredGroupId]: pick(ingredGroup, ingredFields)
    }), {})
)

const ingredientsByLabware: Selector<IngredsForAllLabware> = createSelector(
  getLabware,
  getIngredientGroups,
  getIngredientLocations,
  (_labware: ContainersState, _ingredientGroups: IngredientsState, _ingredLocations: LocationsState) => {
    const allLabwareIds = Object.keys(_labware)
    const allIngredIds = Object.keys(_ingredientGroups)

    return allLabwareIds.reduce((acc: IngredsForAllLabware, labwareId: string) => {
      const ingredsForThisLabware: IngredsForLabware = allIngredIds.reduce(
        (ingredAcc: IngredsForLabware, ingredId: string) => {
          if (_ingredLocations[ingredId] && _ingredLocations[ingredId][labwareId]) {
            return {
              ...ingredAcc,
              [ingredId]: {
                groupId: ingredId,
                ..._ingredientGroups[ingredId],
                wells: _ingredLocations[ingredId][labwareId]
              }
            }
          }
          return ingredAcc
        }, {})

      return {
        ...acc,
        [labwareId]: ingredsForThisLabware
      }
    }, {})
  }
)

const allIngredientNamesIds: BaseState => Array<{ingredientId: string, name: ?string}> = createSelector(
  getIngredientGroups,
  ingreds => Object.keys(ingreds).map(ingredId =>
      ({ingredientId: ingredId, name: ingreds[ingredId].name}))
)

// TODO: just use the individual selectors separately, no need to combine it into 'activeModals'
// -- so you'd have to refactor the props of the containers that use this selector too
type ActiveModals = {
  labwareSelection: boolean,
  ingredientSelection: ?{
    slot: ?string,
    containerName: ?string
  }
}

const activeModals: Selector<ActiveModals> = createSelector(
  rootSelector,
  getLabware,
  getSelectedContainerId,
  (state, _allLabware, _selectedContainerId) => {
    const selectedContainer = _selectedContainerId && _allLabware[_selectedContainerId]
    return ({
      labwareSelection: state.modeLabwareSelection !== false,
      ingredientSelection: {
        slot: selectedContainer && selectedContainer.slot,
        containerName: selectedContainer && selectedContainer.type
      }
    })
  }
)

const labwareToCopy = (state: BaseState) => rootSelector(state).copyLabwareMode

const getSelectedIngredientGroup = (state: BaseState) => rootSelector(state).selectedIngredientGroup

// TODO: prune selectors
export const selectors = {
  rootSelector,

  getIngredientGroups,
  getIngredientLocations,
  getLabware,
  getSelectedContainer,
  getSelectedContainerId,

  activeModals,
  allIngredientGroupFields,
  allIngredientNamesIds,
  loadedContainersBySlot,
  containersBySlot,
  labwareToCopy,
  canAdd,
  selectedIngredientGroup: getSelectedIngredientGroup,
  ingredientsByLabware,
  labwareOptions
}

export default rootReducer
