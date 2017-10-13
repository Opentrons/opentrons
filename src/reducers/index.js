import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
// import pickBy from 'lodash/pickBy'
import range from 'lodash/range'

import { containerDims } from '../constants.js'

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

const modeLabwareSelection = handleActions({
  OPEN_LABWARE_SELECTOR: (state, action) => true,
  CLOSE_LABWARE_SELECTOR: (state, action) => false,
  SELECT_LABWARE_TO_ADD: (state, action) => false // close window when labware is selected
}, false)

const modeIngredientSelection = handleActions({
  OPEN_INGREDIENT_SELECTOR: (state, action) => ({slotName: action.payload.slotName}),
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
    console.log(nextState)
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
  DESELECT_WELLS: () => selectedWellsInitialState
}, selectedWellsInitialState)

const rootReducer = combineReducers({
  modeLabwareSelection,
  modeIngredientSelection,
  loadedContainers,
  selectedWells
})

// SELECTORS

export const selectors = {
  activeModals: state => ({
    labwareSelection: state.default.modeLabwareSelection,
    ingredientSelection: state.default.modeIngredientSelection && {
      slotName: state.default.modeIngredientSelection.slotName,
      // "mix in" selected containerName from loadedContainers
      containerName: state.default.loadedContainers[state.default.modeIngredientSelection.slotName]}
  }),
  loadedContainers: state => state.default.loadedContainers,
  canAdd: state => nextEmptySlot(state.default.loadedContainers),
  wellMatrix: state => {
    const containerType = state.default.loadedContainers[state.default.modeIngredientSelection.slotName] // TODO: DRY this up
    const { rows, columns } = containerDims[containerType] || {rows: 12, columns: 8}

    if (!(containerType in containerDims)) {
      console.warn(`no info in containerDims for "${containerType}", falling back to 8x12`)
    }

    return range(rows - 1, -1, -1).map(
      rowNum => range(columns).map(
        colNum => {
          const wellKey = colNum + ',' + rowNum // Key in selectedWells from getCollidingWells fn
          return {
            number: rowNum * columns + colNum + 1,
            preselected: wellKey in state.default.selectedWells.preselected,
            selected: wellKey in state.default.selectedWells.selected
          }
        }
      )
    )
  }
}

export default rootReducer
