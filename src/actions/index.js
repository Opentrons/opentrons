import { createActions } from 'redux-actions'

// Payload mappers
const mouseCoordPayload = e => ({
  x: e.clientX,
  y: e.clientY,
  targetData: e.target && e.target.dataset
})

// Actions
export const {
  openLabwareSelector,
  closeLabwareSelector,

  openIngredientSelector,
  closeIngredientSelector,

  selectLabwareToAdd,

  deleteContainerAtSlot,

  beginSelectionRect,
  moveSelectionRect,
  endSelectionRect
} = createActions({
  OPEN_LABWARE_SELECTOR: undefined,
  CLOSE_LABWARE_SELECTOR: undefined,

  OPEN_INGREDIENT_SELECTOR: undefined,
  CLOSE_INGREDIENT_SELECTOR: undefined,

  SELECT_LABWARE_TO_ADD: undefined,

  DELETE_CONTAINER_AT_SLOT: undefined,

  BEGIN_SELECTION_RECT: mouseCoordPayload,
  MOVE_SELECTION_RECT: mouseCoordPayload,
  END_SELECTION_RECT: undefined
})
