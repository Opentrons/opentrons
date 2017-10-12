import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import pickBy from 'lodash/pickBy'

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
  OPEN_INGREDIENT_SELECTOR: (state, action) => action.payload,
  CLOSE_INGREDIENT_SELECTOR: (state, action) => null
}, null)

const loadedContainers = handleActions({
  SELECT_LABWARE_TO_ADD: (state, action) => ({...state, [nextEmptySlot(state)]: action.payload}),
  DELETE_CONTAINER_AT_SLOT: (state, action) => pickBy(state, (value, key) => key !== action.payload)
}, {})

// TODO: rename x0 y0 'static' and x1 y1 'dynamic' -> first on mousedown, latter on mousemove
const initialWellSelectionRectState = {x0: 200, y0: 300, x1: 300, y1: 400}
const wellSelectionRect = handleActions({
  BEGIN_SELECTION_RECT: (state, action) => ({x0: action.payload.x, x1: action.payload.x + 10, y0: action.payload.y, y1: action.payload.y + 10}),
  MOVE_SELECTION_RECT: (state, action) => ({...state, x1: action.payload.x, y1: action.payload.y}),
  END_SELECTION_RECT: () => initialWellSelectionRectState
}, initialWellSelectionRectState)

const rootReducer = combineReducers({
  modeLabwareSelection,
  modeIngredientSelection,
  loadedContainers,
  wellSelectionRect
})

// SELECTORS

export const selectors = {
  activeModals: state => ({
    labwareSelection: state.default.modeLabwareSelection,
    ingredientSelection: state.default.modeIngredientSelection
  }),
  loadedContainers: state => state.default.loadedContainers,
  canAdd: state => nextEmptySlot(state.default.loadedContainers),
  selectionRectCoords: state => state.default.wellSelectionRect
}

export default rootReducer
