import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import { createSelector } from 'reselect'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import get from 'lodash/get'
import findKey from 'lodash/findKey'
import set from 'lodash/set' // <- careful, this mutates the object
import range from 'lodash/range'

import { containerDims, toWellName } from '../constants.js'

const sortedSlotnames = [].concat.apply( // flatten
  [],
  [1, 2, 3].map(num => ['A', 'B', 'C', 'D', 'E'].map(letter => letter + num))
)

// UTILS

const nextEmptySlot = loadedContainersSubstate => {
  // Next empty slot in the sorted slotnames order. Or null if no more slots.
  const nextEmptySlotIdx = sortedSlotnames.findIndex(slot => !(slot in loadedContainersSubstate))
  return nextEmptySlotIdx >= sortedSlotnames.length ? null : sortedSlotnames[nextEmptySlotIdx]
}

// REDUCERS

// modeLabwareSelection: boolean. If true, we're selecting labware to add to a slot
// (this state just toggles a modal)
const modeLabwareSelection = handleActions({
  OPEN_LABWARE_SELECTOR: (state, action) => true,
  CLOSE_LABWARE_SELECTOR: (state, action) => false,
  SELECT_LABWARE_TO_ADD: (state, action) => false // close window when labware is selected
}, false)

const selectedSlotName = handleActions({
  OPEN_INGREDIENT_SELECTOR: (state, action) => action.payload.slotName,
  CLOSE_INGREDIENT_SELECTOR: (state, action) => null
}, null)

const selectedIngredientGroup = handleActions({
  OPEN_INGREDIENT_SELECTOR: (state, action) => null,
  EDIT_MODE_INGREDIENT_GROUP: (state, action) => action.payload,
  EDIT_INGREDIENT: (state, action) => null, // unselect ingredient group when edited.
  CLOSE_INGREDIENT_SELECTOR: (state, action) => null
}, null)

const loadedContainers = handleActions({
  SELECT_LABWARE_TO_ADD: (state, action) => ({...state, [nextEmptySlot(state)]: action.payload}),
  DELETE_CONTAINER_AT_SLOT: (state, action) => {
    // For leaving open slots functionality, do this one-liner instead
    // return pickBy(state, (value, key) => key !== action.payload)}

    const deletedSlot = action.payload
    const deletedIdx = sortedSlotnames.findIndex(slot => slot === deletedSlot)
    // Summary:
    //  {A1: 'alex', B1: 'brock', C1: 'charlie'} ==(delete slot B1)==> {A1: 'alex', B1: 'charlie'}
    const nextState = sortedSlotnames.reduce((acc, slotName, i) => slotName === deletedSlot || !(slotName in state)
      ? acc
      : ({...acc, [sortedSlotnames[i < deletedIdx ? i : i - 1]]: state[slotName]}),
      {})

    return nextState
  }
}, {})

const selectedWellsInitialState = {preselected: {}, selected: {}}
const selectedWells = handleActions({
  PRESELECT_WELLS: (state, action) => action.payload.append
    ? {...state, preselected: action.payload.wells} : {selected: {}, preselected: action.payload.wells},
  SELECT_WELLS: (state, action) => ({
    preselected: {},
    selected: {
      ...(action.payload.append ? state.selected : {}),
      ...action.payload.wells
    }
  }),
  EDIT_MODE_INGREDIENT_GROUP: (state, action) => ({selected: action.payload.selectedWells, preselected: {}}),
  // Actions that cause "deselect everything" behavior:
  DESELECT_WELLS: () => selectedWellsInitialState,
  CLOSE_INGREDIENT_SELECTOR: () => selectedWellsInitialState,
  EDIT_INGREDIENT: () => selectedWellsInitialState
}, selectedWellsInitialState)

const ingredients = handleActions({
  EDIT_INGREDIENT: (state, action) => {
    const editableIngredFields = ['name', 'volume', 'concentration', 'description', 'individualize']
    const { groupId, slotName } = action.payload
    if (groupId !== undefined && groupId !== null) {
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
    // No groupId, create new ingredient
    const newGroupId = Object.keys(state).length === 0
      ? 0
      : Math.max(...Object.keys(state).map(key => parseInt(key))) + 1

    return {
      ...state,
      [newGroupId]: {
        ...pick(action.payload, editableIngredFields),
        locations: { [slotName]: action.payload.wells }
      }
    }
  },
  // Remove the deleted group (referenced by array index)
  DELETE_INGREDIENT_GROUP: (state, action) => pickBy(state, (value, key) => key !== action.payload.groupId)
}, {})

const rootReducer = combineReducers({
  modeLabwareSelection,
  selectedSlotName,
  selectedIngredientGroup,
  loadedContainers,
  selectedWells,
  ingredients
})

// SELECTORS

const rootSelector = state => state.default

const loadedContainersBySlot = createSelector(
  rootSelector,
  state => state.loadedContainers
)

const canAdd = createSelector(
  loadedContainersBySlot,
  loadedContainers => nextEmptySlot(loadedContainers)
)

// Currently selected container's slot
const selectedContainerSlot = createSelector(
  rootSelector,
  state => state.selectedSlotName
)

// Uses selectedSlot to determine container type
const selectedContainerType = createSelector(
  selectedContainerSlot,
  loadedContainersBySlot,
  (slotName, allContainers) => allContainers[slotName]
)

// Given ingredientsForContainer obj and rowNum, colNum,
// returns the groupId (string key) of that well, or `undefined`
const ingredAtWell = ingredientsForContainer => ({rowNum, colNum}) => {
  const wellName = toWellName({rowNum, colNum})
  // const matches = Object.keys(ingredientsForContainer)
  //   .filter(ingredGroupId =>
  //     ingredientsForContainer[ingredGroupId].wells.includes(wellName))
  // return matches[0]
  const matchedKey = findKey(ingredientsForContainer, ingred => ingred.wells.includes(wellName))
  const matches = get(ingredientsForContainer, [matchedKey, 'groupId'])

  return matches
}

const allIngredients = createSelector(
  rootSelector,
  state => state.ingredients
)

const selectedWellNames = createSelector(
  state => rootSelector(state).selectedWells.selected,
  selectedWells => Object.values(selectedWells).map(well => {
    const col = well[0]
    const row = well[1]
    return toWellName({colNum: col, rowNum: row})
  }) // TODO factor to util
)

const numWellsSelected = createSelector(
  state => rootSelector(state).selectedWells,
  selectedWells => Object.keys(selectedWells.selected).length)

const ingredientsForContainer = createSelector(
  allIngredients,
  selectedContainerSlot,
  (allIngredients, selectedContainerSlot) => {
    const ingredGroupFromIdx = (allIngredients, idx) => allIngredients[idx]

    const ingredGroupConvert = (ingredGroup, groupId) => ({
      ...ingredGroup,
      groupId,
      // Convert deck-wide data to container-specific
      wells: ingredGroup.locations[selectedContainerSlot],
      wellDetails: get(ingredGroup, ['wellDetailsByLocation', selectedContainerSlot]),
      // Hide the deck-wide data
      locations: undefined,
      wellDetailsByLocation: undefined
    })

    return Object.keys(allIngredients).map(idx => {
      const ingredGroup = ingredGroupFromIdx(allIngredients, idx)
      return ingredGroup.locations && selectedContainerSlot in ingredGroup.locations
        ? ingredGroupConvert(ingredGroup, idx)
        : false
    }).filter(ingred => ingred !== false)
  }
)

// returns selected group id (index in array of all ingredients), or undefined.
// groupId is a string eg '42'
const selectedIngredientGroupId = createSelector(
  rootSelector,
  state => get(state, ['selectedIngredientGroup', 'groupId'])
)

const selectedIngredientGroupObj = createSelector(
  selectedIngredientGroupId,
  allIngredients,
  (ingredGroupId, allIngredients) => allIngredients[ingredGroupId] || null
)

const selectedIngredientProperties = createSelector(
  selectedIngredientGroupObj,
  ingredGroup => (ingredGroup !== null && ingredGroup !== undefined)
    ? pick(ingredGroup, ['name', 'volume', 'concentration', 'description', 'individualize'])
    : {} // <-- TODO: Defaults for new ingred group eg {name: 'Sample', volume: 10}
)

const wellMatrix = createSelector(
  selectedContainerType,
  ingredientsForContainer,
  state => rootSelector(state).selectedWells,
  (containerType, ingredientsForContainer, selectedWells) => {
    if (!containerType) {
      return undefined
    }
    const { rows, columns, wellShape } = containerDims(containerType)

    return range(rows - 1, -1, -1).map(
      rowNum => range(columns).map(
        colNum => {
          const wellKey = colNum + ',' + rowNum // Key in selectedWells from getCollidingWells fn
          // parse the ingredientGroupId to int, or set to null if the well is empty
          const _ingredientGroupId = ingredAtWell(ingredientsForContainer)({rowNum, colNum})
          const ingredientGroupId = (_ingredientGroupId !== undefined)
            ? parseInt(_ingredientGroupId, 10)
            : null

          return {
            number: rowNum * columns + colNum + 1,
            wellShape,
            preselected: wellKey in selectedWells.preselected,
            selected: wellKey in selectedWells.selected,
            ingredientGroupId
          }
        }
      )
    )
  }
)

// TODO: just use the individual selectors separately, no need to combine it into 'activeModals'
// -- so you'd have to refactor the props of the containers that use this selector too
const activeModals = createSelector(
  rootSelector,
  selectedContainerSlot,
  selectedContainerType,
  (state, slotName, containerType) => ({
    labwareSelection: state.modeLabwareSelection,
    ingredientSelection: {
      slotName,
      containerName: containerType
    }
  })
)

export const selectors = {
  activeModals,
  loadedContainersBySlot,
  canAdd,
  wellMatrix,
  numWellsSelected,
  selectedWellNames,
  selectedContainerSlot,
  ingredientsForContainer,
  selectedIngredientProperties,
  selectedIngredientGroupId
}

export default rootReducer
