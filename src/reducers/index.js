import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'
import pickBy from 'lodash/pickBy'
import range from 'lodash/range'

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
  DESELECT_WELLS: () => selectedWellsInitialState
}, selectedWellsInitialState)

const wellMatrixDims = handleActions({
  // TODO!!!!!!!!
}, {rows: 12, columns: 8})

const rootReducer = combineReducers({
  modeLabwareSelection,
  modeIngredientSelection,
  loadedContainers,
  selectedWells,
  wellMatrixDims
})

// SELECTORS

export const selectors = {
  activeModals: state => ({
    labwareSelection: state.default.modeLabwareSelection,
    ingredientSelection: state.default.modeIngredientSelection
  }),
  loadedContainers: state => state.default.loadedContainers,
  canAdd: state => nextEmptySlot(state.default.loadedContainers),
  wellMatrix: state => range(state.default.wellMatrixDims.rows - 1, -1, -1).map(
    rowNum => range(state.default.wellMatrixDims.columns).map(
      colNum => {
        const wellKey = colNum + ',' + rowNum // Key in selectedWells from getCollidingWells fn
        return {
          number: rowNum * state.default.wellMatrixDims.columns + colNum + 1,
          preselected: wellKey in state.default.selectedWells.preselected,
          selected: wellKey in state.default.selectedWells.selected
        }
      }
    )
  )
}

export default rootReducer
