import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import { createSelector } from 'reselect'

import findKey from 'lodash/findKey'
import get from 'lodash/get'
import isNil from 'lodash/isNil'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import reduce from 'lodash/reduce'
import set from 'lodash/set' // <- careful, this mutates the object
import uniq from 'lodash/uniq'

import { getMaxVolumes, defaultContainers, sortedSlotnames } from '../../constants.js' // TODO factor out constants
import { uuid } from '../../utils.js'

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
  OPEN_LABWARE_SELECTOR: (state, action) => action.payload.slotName,
  CLOSE_LABWARE_SELECTOR: (state, action) => false,
  CREATE_CONTAINER: (state, action) => false // close window when labware is selected
}, false)

// If falsey, we aren't copying labware. Else, value should be the containerID we're
// ready to copy.
const copyLabwareMode = handleActions({
  SET_COPY_LABWARE_MODE: (state, action) => action.payload, // payload should be containerID to copy
  COPY_LABWARE: (state, action) => false // leave copy mode after performing a copy action
}, false)

const selectedContainer = handleActions({
  OPEN_INGREDIENT_SELECTOR: (state, action) => action.payload,
  CLOSE_INGREDIENT_SELECTOR: (state, action) => null
}, null)

const selectedIngredientGroup = handleActions({
  EDIT_MODE_INGREDIENT_GROUP: (state, action) => action.payload, // selected ingredient group to edit
  OPEN_INGREDIENT_SELECTOR: (state, action) => null,
  EDIT_INGREDIENT: (state, action) => null, // unselect ingredient group when edited.
  DELETE_INGREDIENT: (state, action) => null, // unselect ingredient group when deleted.
  CLOSE_INGREDIENT_SELECTOR: (state, action) => null
}, null)

export const containers = handleActions({
  CREATE_CONTAINER: (state, action) => ({
    ...state,
    [uuid() + ':' + action.payload.containerType]: {
      slotName: action.payload.slotName || nextEmptySlot(_loadedContainersBySlot(state)),
      type: action.payload.containerType,
      name: null // create with null name, so we force explicit naming.
    }
  }),
  DELETE_CONTAINER: (state, action) => pickBy(state, (value, key) => key !== action.payload.containerId),
  MODIFY_CONTAINER: (state, action) => {
    const { containerId, modify } = action.payload
    return {...state, [containerId]: {...state[containerId], ...modify}}
  },
  COPY_LABWARE: (state, action) => {
    const { fromContainer, toContainer, toSlot } = action.payload
    return {...state, [toContainer]: {...state[fromContainer], slotName: toSlot}}
  }
}, {
  'default-trash': {
    type: 'trash-box',
    name: 'Trash',
    slotName: '12'
  }
})

const selectedWellsInitialState = {preselected: {}, selected: {}}
const selectedWells = handleActions({
  PRESELECT_WELLS: (state, action) => action.payload.append
    ? {...state, preselected: action.payload.wells}
    : {selected: {}, preselected: action.payload.wells},
  SELECT_WELLS: (state, action) => ({
    preselected: {},
    selected: {
      ...(action.payload.append ? state.selected : {}),
      ...action.payload.wells
    }
  }),
  // Actions that cause "deselect everything" behavior:
  EDIT_MODE_INGREDIENT_GROUP: (state, action) => selectedWellsInitialState, // ({selected: action.payload.selectedWells, preselected: {}}),
  DESELECT_WELLS: () => selectedWellsInitialState,
  CLOSE_INGREDIENT_SELECTOR: () => selectedWellsInitialState,
  EDIT_INGREDIENT: () => selectedWellsInitialState
}, selectedWellsInitialState)

const highlightedIngredients = handleActions({
  HOVER_WELL_BEGIN: (state, action) => ({ wells: action.payload }),
  HOVER_WELL_END: (state, action) => ({}) // clear highlighting
}, {})

export const ingredients = handleActions({
  EDIT_INGREDIENT: (state, action) => {
    const editableIngredFields = ['name', 'serializeName', 'volume', 'concentration', 'description', 'individualize']
    const { groupId, containerId, copyGroupId } = action.payload
    if (!isNil(groupId)) {
      // GroupId was given, edit existing ingredient
      return set(
        {...state},
        groupId,
        {
          ...state[groupId],
          ...pick(action.payload, editableIngredFields)
          // TODO: changing wells and wellDetails
        }
      )
    }
    // No groupId, create new ingredient groupId by adding 1 to the highest ID
    // TODO: use uuid, use an array of uuids to give order to ingreds.
    const newGroupId = Object.keys(state).length === 0
      ? 0
      : Math.max(...Object.keys(state).map(key => parseInt(key))) + 1

    const isUnchangedClone = state[copyGroupId] && editableIngredFields.every(field =>
        state[copyGroupId][field] === action.payload[field])

    if (isUnchangedClone) {
      // for an unchanged clone, just add the new wells.
      // TODO: make this more concise
      return {
        ...state,
        [copyGroupId]: {
          ...state[copyGroupId],
          locations: {
            ...state[copyGroupId].locations,
            [containerId]: state[copyGroupId].locations[containerId]
              ? uniq(state[copyGroupId].locations[containerId].concat(action.payload.wells))
              : action.payload.wells
          }
        }
      }
    }

    // otherwise, create a new ingredient group
    return {
      ...state,
      [newGroupId]: {
        ...pick(action.payload, editableIngredFields),
        locations: { [containerId]: action.payload.wells },
        name: state[copyGroupId] && state[copyGroupId].name === action.payload.name
          ? state[copyGroupId].name + ' copy' // todo: copy 2, copy 3 etc.
          : action.payload.name
      }
    }
  },
  // Remove the deleted group (referenced by array index)
  DELETE_INGREDIENT: (state, action) => {
    const { wellName, groupId, containerId } = action.payload
    return (wellName)
      ? {
        ...state,
        [groupId]: {
          ...state[groupId],
          locations: {
            ...state[groupId].locations,
            [containerId]: state[groupId].locations[containerId].filter(well => well !== wellName)
          }
        }
      }
      : pickBy(state, (value, key) => key !== groupId)
  },
  COPY_LABWARE: (state, action) => {
    const { fromContainer, toContainer } = action.payload
    return reduce(state, (acc, ingredData, ingredId) => ({
      ...acc,
      [ingredId]: fromContainer in ingredData.locations
        // this ingred has instances located in the container we're cloning,
        // copy it into the 'toContainer' clone
        ? {
          ...ingredData,
          locations: {...ingredData.locations, [toContainer]: ingredData.locations[fromContainer]}
        }
        // no instances in the clone parent, do nothing to this ingred
        : ingredData
    }), {})
  }
}, {})

// TODO Ian 2018-01-15 factor into separate files
const rootReducer = combineReducers({
  modeLabwareSelection,
  copyLabwareMode,
  selectedContainer,
  selectedIngredientGroup,
  containers,
  selectedWells,
  ingredients,
  highlightedIngredients
})

// SELECTORS

const rootSelector = state => state.labwareIngred // TODO

const _loadedContainersBySlot = containers =>
  reduce(containers, (acc, container, containerId) => (container.slotName)
    ? {...acc, [container.slotName]: container.type}
    : acc
  , {})

const loadedContainersBySlot = createSelector(
  state => rootSelector(state).containers,
  containers => _loadedContainersBySlot(containers)
)

// const canAdd = createSelector(
//   loadedContainersBySlot,
//   loadedContainers => nextEmptySlot(loadedContainers)
// )

const canAdd = state => rootSelector(state).modeLabwareSelection // false or selected slotName to add labware to, eg 'A2'

// Currently selected container's slot
const selectedContainerSlot = createSelector(
  rootSelector,
  state => get(state, ['selectedContainer', 'slotName'])
)

const selectedContainerSelector = createSelector(
  rootSelector,
  state => state.selectedContainer
)

const containerById = containerId => state => {
  const container = rootSelector(state).containers
  return container && container[containerId]
    ? {
      ...container[containerId],
      containerId
    }
    : null
}

const containersBySlot = createSelector(
  state => rootSelector(state).containers,
  containers => reduce(containers, (acc, containerObj, containerId) =>
    ({
      ...acc,
      // NOTE: containerId added in so you still have a reference
      [containerObj.slotName]: {...containerObj, containerId}
    })
  , {})
)

// Uses selectedSlot to determine container type
const selectedContainerType = createSelector(
  selectedContainerSlot,
  loadedContainersBySlot,
  (slotName, allContainers) => allContainers[slotName]
)

// Given ingredientsForContainer obj and wellName (eg 'A1'),
// returns the ingred data for that well, or `undefined`
const _ingredAtWell = ingredientsForContainer => (wellName) => {
  const matchedKey = findKey(ingredientsForContainer, ingred => ingred.wells.includes(wellName))
  const matchedIngred = ingredientsForContainer[matchedKey]

  const ingredientNum = matchedIngred && matchedIngred.wells && matchedIngred.wells.findIndex(w => w === wellName) + 1

  return {...matchedIngred, ingredientNum, wellName}
}

const allIngredients = createSelector(
  rootSelector,
  state => state.ingredients
)

// returns selected group id (index in array of all ingredients), or undefined.
// groupId is a string eg '42'
const selectedIngredientGroupId = createSelector(
  rootSelector,
  state => get(state, ['selectedIngredientGroup', 'groupId'])
)

// const _selectedIngredientGroupObj = createSelector(
//   selectedIngredientGroupId,
//   allIngredients,
//   (ingredGroupId, allIngredients) => allIngredients[ingredGroupId]
//     ? ({...allIngredients[ingredGroupId], groupId: ingredGroupId})
//     : null
// )
//
// const selectedIngredientProperties = createSelector(
//   _selectedIngredientGroupObj,
//   ingredGroup => (!isNil(ingredGroup))
//     ? pick(ingredGroup, ['name', 'serializeName', 'volume', 'concentration', 'description', 'individualize', 'groupId'])
//     : null
// )

const ingredFields = ['name', 'serializeName', 'volume', 'concentration', 'description', 'individualize', 'groupId']

const allIngredientGroupFields = createSelector(
  allIngredients,
  allIngredients => reduce(allIngredients, (acc, ingredGroup, ingredGroupId) => ({
    ...acc,
    [ingredGroupId]: pick(ingredGroup, ingredFields)
  }), {})
)

const selectedWellNames = createSelector(
  state => rootSelector(state).selectedWells.selected,
  selectedWells => Object.values(selectedWells)
)

const numWellsSelected = createSelector(
  state => rootSelector(state).selectedWells,
  selectedWells => Object.keys(selectedWells.selected).length)

const selectedWellsMaxVolume = createSelector(
  state => rootSelector(state).selectedWells,
  selectedContainerType,
  (selectedWells, selectedContainerType) => {
    const selectedWellNames = Object.keys(selectedWells.selected)
    const maxVolumesByWell = getMaxVolumes(selectedContainerType)
    const maxVolumesList = (selectedWellNames.length > 0)
      // when wells are selected, only look at vols of selected wells
      ? Object.values(pick(maxVolumesByWell, selectedWellNames))
      // when no wells selected (eg editing ingred group), look at all volumes.
      // TODO LATER: look at filled wells, not all wells.
      : Object.values(maxVolumesByWell)
    return Math.min(...maxVolumesList)
  }
)

const _ingredientsForContainerId = (allIngredients, containerId) => {
  const ingredGroupFromIdx = (allIngredients, idx) => allIngredients[idx]

  const ingredGroupConvert = (ingredGroup, groupId) => ({
    ...ingredGroup,
    groupId,
    // Convert deck-wide data to container-specific
    wells: ingredGroup.locations[containerId],
    wellDetails: get(ingredGroup, ['wellDetailsByLocation', containerId]),
    // Hide the deck-wide data
    locations: undefined,
    wellDetailsByLocation: undefined
  })

  return Object.keys(allIngredients).map(idx => {
    const ingredGroup = ingredGroupFromIdx(allIngredients, idx)
    return ingredGroup.locations && containerId in ingredGroup.locations
    ? ingredGroupConvert(ingredGroup, idx)
    : false
  }).filter(ingred => ingred !== false)
}
const ingredientsForContainer = createSelector(
  allIngredients,
  selectedContainerSelector,
  (allIngredients, selectedContainer) => {
    return selectedContainer.containerId
    ? _ingredientsForContainerId(allIngredients, selectedContainer.containerId)
    : null
  }
)

// [{ingredientId, name}]
const allIngredientNamesIds = createSelector(
  allIngredients,
  allIngreds => Object.keys(allIngreds).map(ingredId =>
      ({ingredientId: ingredId, name: allIngreds[ingredId].name}))
)

const _getWellContents = (containerType, ingredientsForContainer, selectedWells, highlightedWells) => {
  // selectedWells and highlightedWells args may both be null,
  // they're only relevant to the selected container.
  if (!containerType) {
    console.warn('_getWellContents called with no containerType, skipping')
    return undefined
  }

  const containerData = defaultContainers.containers[containerType]
  if (!containerData) {
    console.warn('No data for container type ' + containerType)
    return []
  }
  const allLocations = containerData.locations

  return reduce(allLocations, (acc, location, wellName) => {
    // get ingred data, or set to null if the well is empty
    const ingredData = _ingredAtWell(ingredientsForContainer)(wellName) || null
    const isHighlighted = highlightedWells ? wellName in highlightedWells : false

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
  state => rootSelector(state).containers,
  (allIngredients, containers, selectedWells) => reduce(containers, (acc, container, containerId) => {
    const wellContents = _getWellContents(
      container.type,
      _ingredientsForContainerId(allIngredients, containerId),
      null, // selectedWells is only for the selected container, so treat as empty selection.
      null // so is highlightedWells
    )

    return {
      ...acc,
      [containerId]: wellContents
    }
  }, {})
)

const wellContentsSelectedContainer = createSelector(
  selectedContainerType,
  ingredientsForContainer,
  state => rootSelector(state).selectedWells, // wells are selected only for the selected container.
  state => rootSelector(state).highlightedIngredients.wells,
  _getWellContents
)

// TODO: just use the individual selectors separately, no need to combine it into 'activeModals'
// -- so you'd have to refactor the props of the containers that use this selector too
const activeModals = createSelector(
  rootSelector,
  selectedContainerSlot,
  selectedContainerType,
  (state, slotName, containerType) => ({
    labwareSelection: state.modeLabwareSelection !== false,
    ingredientSelection: {
      slotName,
      containerName: containerType
    }
  })
)

const labwareToCopy = state => rootSelector(state).copyLabwareMode

// TODO: prune selectors
export const selectors = {
  activeModals,
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
  selectedIngredientGroupId
}

export default rootReducer
