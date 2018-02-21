// @flow
import {combineReducers} from 'redux'
import {handleActions, type ActionType} from 'redux-actions'
import {createSelector} from 'reselect'

import findKey from 'lodash/findKey'
import get from 'lodash/get'
import min from 'lodash/min'
import omit from 'lodash/omit'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import reduce from 'lodash/reduce'
import uniq from 'lodash/uniq'

import {getMaxVolumes, defaultContainers, sortedSlotnames} from '../../constants.js'
import {uuid} from '../../utils.js'

import {editableIngredFields} from '../types'
import type {
  IngredInputFields,
  Labware,
  Wells,
  WellMatrices,
//  WellContents,
// WellDetails,
  AllWellContents,
  Ingredient
} from '../types'
import type {BaseState, JsonWellData, VolumeJson} from '../../types'
import * as actions from '../actions'
import type {CopyLabware, DeleteIngredient, EditIngredient} from '../actions'

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

const selectedContainer = handleActions({
  OPEN_INGREDIENT_SELECTOR: (state, action: ActionType<typeof actions.openIngredientSelector>) => action.payload,
  CLOSE_INGREDIENT_SELECTOR: (state, action: ActionType<typeof actions.closeIngredientSelector>) => null
}, null)

type SelectedIngredientGroupState = {|
  groupId: string,
  wellName: string
|} | null

const selectedIngredientGroup = handleActions({
  // selected ingredient group to edit
  // TODO: SelectedIngredientGroupState is type of payload, type the action though
  EDIT_MODE_INGREDIENT_GROUP: (state, action: ActionType<typeof actions.editModeIngredientGroup>) => action.payload,

  OPEN_INGREDIENT_SELECTOR: () => null,
  EDIT_INGREDIENT: () => null, // unselect ingredient group when edited.
  DELETE_INGREDIENT: () => null, // unselect ingredient group when deleted.
  CLOSE_INGREDIENT_SELECTOR: () => null
}, null)

type ContainersState = {
  [id: string]: Labware
}

const initialLabwareState = {
  'default-trash': {
    id: 'default-trash',
    type: 'trash-box',
    name: 'Trash',
    slot: '12'
  }
}

export const containers = handleActions({
  CREATE_CONTAINER: (state: ContainersState, action: ActionType<typeof actions.createContainer>) => ({
    ...state,
    [uuid() + ':' + action.payload.containerType]: {
      slot: action.payload.slot || nextEmptySlot(_loadedContainersBySlot(state)),
      type: action.payload.containerType,
      name: null // create with null name, so we force explicit naming.
    }
  }),
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

type SelectedWellsState = {|
  preselected: Wells,
  selected: Wells
|}
const selectedWellsInitialState: SelectedWellsState = {preselected: {}, selected: {}}
const selectedWells = handleActions({
  PRESELECT_WELLS: (state, action: ActionType<typeof actions.preselectWells>) => action.payload.append
    ? {...state, preselected: action.payload.wells}
    : {selected: {}, preselected: action.payload.wells},

  SELECT_WELLS: (state, action: ActionType<typeof actions.selectWells>) => ({
    preselected: {},
    selected: {
      ...(action.payload.append ? state.selected : {}),
      ...action.payload.wells
    }
  }),
  // Actions that cause "deselect everything" behavior:
  EDIT_MODE_INGREDIENT_GROUP: (state, action: ActionType<typeof actions.editModeIngredientGroup>) =>
    selectedWellsInitialState,
  CLOSE_INGREDIENT_SELECTOR: () => selectedWellsInitialState,
  EDIT_INGREDIENT: () => selectedWellsInitialState
}, selectedWellsInitialState)

type HighlightedIngredientsState = {wells: Wells}
const highlightedIngredients = handleActions({
  HOVER_WELL_BEGIN: (state, action: ActionType<typeof actions.hoverWellBegin>) => ({ wells: action.payload }),
  HOVER_WELL_END: (state, action: ActionType<typeof actions.hoverWellBegin>) => ({}) // clear highlighting
}, {})

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
        [groupId]: pick(action.payload, editableIngredFields)
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
        ...pick(action.payload, editableIngredFields)
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
  [ingredGroupId: string]: {
    [containerId: string]: Array<string> // array of well names
  }
}

export const ingredLocations = handleActions({
  EDIT_INGREDIENT: (state: LocationsState, action: EditIngredient) => {
    const { groupId, containerId, isUnchangedClone } = action.payload

    if (isUnchangedClone) {
      // for an unchanged clone, just add the new wells.
      return {
        ...state,
        [groupId]: {
          ...state[groupId],
          [containerId]: uniq([
            ...(state[groupId][containerId] || []),
            ...action.payload.wells
          ])
        }
      }
    }

    return {
      ...state,
      [groupId]: {
        [containerId]: action.payload.wells
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
          [containerId]: state[groupId][containerId].filter(well => well !== wellName)
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
  selectedContainer: string | null,
  selectedIngredientGroup: SelectedIngredientGroupState,
  containers: ContainersState,
  selectedWells: SelectedWellsState,
  ingredients: IngredientsState,
  ingredLocations: LocationsState,
  highlightedIngredients: HighlightedIngredientsState
|}

// TODO Ian 2018-01-15 factor into separate files
const rootReducer = combineReducers({
  modeLabwareSelection,
  copyLabwareMode,
  selectedContainer,
  selectedIngredientGroup,
  containers,
  selectedWells,
  ingredients,
  ingredLocations,
  highlightedIngredients
})

// SELECTORS
const rootSelector = (state: BaseState): RootState => state.labwareIngred

const _loadedContainersBySlot = (containers: ContainersState) =>
  reduce(containers, (acc, container: Labware, containerId) => (container.slot)
    ? {...acc, [container.slot]: container.type}
    : acc
  , {})

const loadedContainersBySlot = createSelector(
  (state: BaseState) => rootSelector(state).containers,
  containers => _loadedContainersBySlot(containers)
)

/** Returns options for dropdowns, excluding tiprack labware */
const labwareOptions: (state: BaseState) => Array<{value: string, name: string}> = createSelector(
  state => rootSelector(state).containers,
  containers => reduce(containers, (acc, containerFields: Labware, containerId) => {
    // TODO Ian 2018-02-16 more robust way to filter out tipracks?
    if (!containerFields.type || containerFields.type.startsWith('tiprack')) {
      return acc
    }
    return [
      ...acc,
      {name: containerFields.name, value: containerId}
    ]
  }, [])
)

const canAdd = (state: BaseState) => rootSelector(state).modeLabwareSelection // false or selected slot to add labware to, eg 'A2'

// TODO just use container selector
const containerById = (containerId: string) => (state: BaseState) => {
  const container = rootSelector(state).containers
  return container && container[containerId]
    ? {
      ...container[containerId],
      containerId
    }
    : null
}

// TODO: containerId should be intrinsic to container reducer?
const selectedContainerSelector = createSelector(
  rootSelector,
  state => (state.selectedContainer === null)
    ? null
    : {
      ...state.containers[state.selectedContainer],
      containerId: state.selectedContainer
    }
)

// Currently selected container's slot
// TODO flow type container so this doesn't need its own selector
const selectedContainerSlot = createSelector(
  selectedContainerSelector,
  container => container && container.slot
)

const containersBySlot = createSelector(
  (state: BaseState) => rootSelector(state).containers,
  containers => reduce(containers, (acc, containerObj: Labware, containerId) =>
    ({
      ...acc,
      // NOTE: containerId added in so you still have a reference
      [containerObj.slot]: {...containerObj, containerId}
    })
  , {})
)

// Uses selectedSlot to determine container type
const selectedContainerType = createSelector(
  selectedContainerSlot,
  loadedContainersBySlot,
  (slot, allContainers) => slot && allContainers[slot]
)

// _ingredAtWell: Given ingredientsForContainer obj and wellName (eg 'A1'),
// returns the ingred data for that well, or `undefined`
//
// TODO IMMEDIATELY Ian 2018-02-20: there should not be such a crazy polymorphic fn
// that takes either Array of Ingred vs objected keyed by ingred
// I need to standardize on one
const _ingredAtWell = (ingredientsForContainer: Array<Ingredient> | {[containerId: string]: Ingredient}) =>
  (wellName: string): Ingredient | null => {
    let matchedKey

    if (Array.isArray(ingredientsForContainer)) {
      matchedKey = ingredientsForContainer.find(ingred => {
        const wells = Array.isArray(ingred.wells)
        ? ingred.wells
        : Object.keys(ingred.wells)
        return wells.includes(wellName)
      })
      matchedKey = matchedKey && matchedKey.groupId
    } else {
      matchedKey = findKey(ingredientsForContainer, ingred => {
        const wells = Array.isArray(ingred.wells)
        ? ingred.wells
        : Object.keys(ingred.wells)
        return wells.includes(wellName)
      })
    }

    if (matchedKey) {
      const matchedIngred = Array.isArray(ingredientsForContainer)
        ? ingredientsForContainer[parseInt(matchedKey)]
        : ingredientsForContainer[matchedKey]
      const wells = Array.isArray(matchedIngred.wells)
        ? matchedIngred.wells
        : Object.keys(matchedIngred.wells)
      const ingredientNum = (wells.findIndex(w => w === wellName) + 1).toString()

      return {
        ...matchedIngred,
        wells: matchedIngred.wells,
        wellDetails: matchedIngred.wellDetails,
        wellDetailsByLocation: matchedIngred.wellDetailsByLocation,
        groupId: ingredientNum
      }
    }

    return null
  }

type IngredView = {
  [labwareId: string]: {|
      ...IngredInputFields,
      locations: {
        [containerId: string]: Wells
      }
  |}
}

const allIngredients: (BaseState) => IngredView = createSelector(
  rootSelector,
  state => reduce(state.ingredients, (acc, ingredData: IngredInputFields, ingredId) => {
    return {
      ...acc,
      [ingredId]: {
        ...ingredData,
        locations: state.ingredLocations[ingredId]
      }
    }
  }, {})
)

// returns selected group id (index in array of all ingredients), or undefined.
// groupId is a string eg '42'
const selectedIngredientGroupId = createSelector(
  rootSelector,
  (state: RootState) => state.selectedIngredientGroup
    ? state.selectedIngredientGroup.groupId
    : null
)

const ingredFields = ['name', 'serializeName', 'volume', 'concentration', 'description', 'individualize', 'groupId']

type IngredGroupField = {
  groupId: string,
  ...IngredInputFields
}

type IngredGroupFields = {
  [ingredGroupId: string]: IngredGroupField
}
const allIngredientGroupFields = createSelector(
  allIngredients,
  (_allIngredients) => reduce(
    _allIngredients,
    (acc: IngredGroupFields, ingredGroup: IngredGroupFields, ingredGroupId: string) => ({
      ...acc,
      [ingredGroupId]: pick(ingredGroup, ingredFields)
    }), {})
)

const selectedWellNames = createSelector(
  (state: BaseState) => rootSelector(state).selectedWells.selected,
  selectedWells => Object.values(selectedWells)
)

const numWellsSelected = createSelector(
  (state: BaseState) => rootSelector(state).selectedWells,
  selectedWells => Object.keys(selectedWells.selected).length)

const selectedWellsMaxVolume = createSelector(
  (state: BaseState) => rootSelector(state).selectedWells,
  selectedContainerType,
  (selectedWells, selectedContainerType) => {
    const selectedWellNames = Object.keys(selectedWells.selected)
    if (!selectedContainerType) {
      console.warn('No container type selected, cannot get max volume')
      return null
    }
    const maxVolumesByWell = getMaxVolumes(selectedContainerType)
    const maxVolumesList = (selectedWellNames.length > 0)
      // when wells are selected, only look at vols of selected wells
      ? Object.values(pick(maxVolumesByWell, selectedWellNames))
      // when no wells selected (eg editing ingred group), look at all volumes.
      // TODO LATER: look at filled wells, not all wells.
      : Object.values(maxVolumesByWell)
    return min(maxVolumesList)
  }
)

const _ingredientsForContainerId = (allIngredients, containerId): Array<Ingredient> => {
  const ingredGroupFromIdx = (allIngredients, idx) => allIngredients && allIngredients[idx]

  const ingredGroupConvert = (ingredGroup, groupId): Ingredient => ({
    ...ingredGroup, // TODO IMMEDIATELY. Which fields are required?
    groupId,
    // Convert deck-wide data to container-specific
    wells: ingredGroup.locations[containerId],
    wellDetails: get(ingredGroup, ['wellDetailsByLocation', containerId]),
    // Hide the deck-wide data
    wellDetailsByLocation: null
  })

  return Object.keys(allIngredients).reduce((acc, idx) => {
    const ingredGroup = ingredGroupFromIdx(allIngredients, idx)

    return (ingredGroup.locations && containerId in ingredGroup.locations)
      ? [...acc, ingredGroupConvert(ingredGroup, idx)]
      : acc
  }, [])
}

const ingredientsForContainer: BaseState => Array<Ingredient> | null = createSelector(
  allIngredients,
  selectedContainerSelector,
  (_allIngredients, selectedContainer) => {
    return (selectedContainer)
    ? _ingredientsForContainerId(_allIngredients, selectedContainer.containerId)
    : null
  }
)

const allIngredientNamesIds: BaseState => Array<{ingredientId: string, name: ?string}> = createSelector(
  allIngredients,
  allIngreds => Object.keys(allIngreds).map(ingredId =>
      ({ingredientId: ingredId, name: allIngreds[ingredId].name}))
)

const _getWellContents = (
  containerType: ?string,
  ingredientsForContainer: Array<Ingredient> | null,
  selectedWells: ?{
    preselected: Wells,
    selected: Wells
  },
  highlightedWells: ?Wells
): AllWellContents | null => {
  // selectedWells and highlightedWells args may both be null,
  // they're only relevant to the selected container.
  if (!containerType) {
    console.warn('_getWellContents called with no containerType, skipping')
    return null
  }

  const containerData: VolumeJson = defaultContainers.containers[containerType]
  if (!containerData) {
    console.warn('No data for container type ' + containerType)
    return null
  }
  const allLocations = containerData.locations

  return reduce(allLocations, (acc, location: JsonWellData, wellName: string): AllWellContents => {
    // get ingred data, or set to null if the well is empty
    const ingredData = (!ingredientsForContainer)
      ? null
      : _ingredAtWell(ingredientsForContainer)(wellName)

    const isHighlighted = highlightedWells ? (wellName in highlightedWells) : false

    return {
      ...acc,
      [wellName]: {
        preselected: selectedWells ? wellName in selectedWells.preselected : false,
        selected: selectedWells ? wellName in selectedWells.selected : false,
        highlighted: isHighlighted, // TODO remove 'highlighted' state?
        maxVolume: location['total-liquid-volume'] || Infinity,
        hovered: highlightedWells && isHighlighted && Object.keys(highlightedWells).length === 1,
        ...ingredData // TODO contents of ingredData (_ingredAtWell) is hard to follow, needs to be cleaned up
      }
    }
  }, {})
}

const allWellMatricesById = createSelector(
  allIngredients,
  (state: BaseState) => rootSelector(state).containers,
  (_allIngredients, _containers) => reduce(
    _containers,
    (acc: WellMatrices, container: Labware, containerId: string): WellMatrices => {
      const wellContents = _getWellContents(
        container.type,
        _ingredientsForContainerId(_allIngredients, containerId),
        null, // selectedWells is only for the selected container, so treat as empty selection.
        null // so is highlightedWells
      )

      return {
        ...acc,
        [containerId]: wellContents
      }
    },
  {})
)

const wellContentsSelectedContainer = createSelector(
  selectedContainerType,
  ingredientsForContainer,
  (state: BaseState) => rootSelector(state).selectedWells, // wells are selected only for the selected container.
  (state: BaseState) => rootSelector(state).highlightedIngredients.wells,
  (_selectedContainerType, _ingredsForContainer, selectedWells, highlightedWells) =>
    _getWellContents(
      _selectedContainerType, _ingredsForContainer, selectedWells, highlightedWells
    )
)

// TODO: just use the individual selectors separately, no need to combine it into 'activeModals'
// -- so you'd have to refactor the props of the containers that use this selector too
const activeModals = createSelector(
  rootSelector,
  selectedContainerSlot,
  selectedContainerType,
  (state, slot, containerType) => {
    return ({
      labwareSelection: state.modeLabwareSelection !== false,
      ingredientSelection: {
        slot,
        containerName: containerType
      }
    })
  }
)

const labwareToCopy = (state: BaseState) => rootSelector(state).copyLabwareMode

// TODO: prune selectors
export const selectors = {
  activeModals,
  allIngredients,
  allIngredientGroupFields,
  allIngredientNamesIds,
  allWellMatricesById,
  loadedContainersBySlot,
  containersBySlot,
  labwareToCopy,
  canAdd,
  wellContentsSelectedContainer,
  numWellsSelected,
  selectedWellsMaxVolume,
  selectedWellNames,
  selectedContainerSlot,
  selectedContainer: selectedContainerSelector,
  containerById,
  ingredientsForContainer,
  // selectedIngredientProperties,
  selectedIngredientGroupId,
  labwareOptions
}

export default rootReducer
