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

  mouseDownOnWell,
  mouseUpOnWell,
  mouseUpOnNonwell
} = createActions({
  OPEN_LABWARE_SELECTOR: undefined,
  CLOSE_LABWARE_SELECTOR: undefined,

  OPEN_INGREDIENT_SELECTOR: undefined,
  CLOSE_INGREDIENT_SELECTOR: undefined,

  SELECT_LABWARE_TO_ADD: undefined,

  DELETE_CONTAINER_AT_SLOT: undefined,

  MOUSE_DOWN_ON_WELL: mouseCoordPayload,
  MOUSE_UP_ON_WELL: mouseCoordPayload,
  MOUSE_DOWN_ON_NONWELL: mouseCoordPayload
})
