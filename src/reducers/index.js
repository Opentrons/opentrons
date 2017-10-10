import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'

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
  OPEN_LABWARE_DROPDOWN: (state, action) => true,
  CLOSE_LABWARE_DROPDOWN: (state, action) => false,
  SELECT_LABWARE_TO_ADD: (state, action) => false // close window when labware is selected
}, false)

const loadedContainers = handleActions({
  SELECT_LABWARE_TO_ADD: (state, action) => ({...state, [nextEmptySlot(state)]: action.payload})
}, {}) // 'A1': '96-deep-well'})

const rootReducer = combineReducers({
  modeLabwareSelection,
  loadedContainers
})

// SELECTORS

export const selectors = {
  modeLabwareSelection: state => state.default.modeLabwareSelection,
  loadedContainers: state => state.default.loadedContainers,
  canAdd: state => nextEmptySlot(state.default.loadedContainers)
}

export default rootReducer
