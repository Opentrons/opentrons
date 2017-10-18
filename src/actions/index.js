import { createActions } from 'redux-actions'

// Payload mappers
// const mouseCoordPayload = e => ({
//   x: e.clientX,
//   y: e.clientY,
//   targetData: e.target && e.target.dataset
// })

// Actions
export const {
  openLabwareSelector,
  closeLabwareSelector,

  openIngredientSelector,
  closeIngredientSelector,

  selectLabwareToAdd,

  deleteContainerAtSlot,

  preselectWells,
  selectWells,
  deselectWells,

  editIngredientGroup
} = createActions({
  OPEN_LABWARE_SELECTOR: undefined,
  CLOSE_LABWARE_SELECTOR: undefined,

  OPEN_INGREDIENT_SELECTOR: undefined,
  CLOSE_INGREDIENT_SELECTOR: undefined,

  SELECT_LABWARE_TO_ADD: undefined,

  DELETE_CONTAINER_AT_SLOT: undefined,

  PRESELECT_WELLS: undefined,
  SELECT_WELLS: undefined,
  DESELECT_WELLS: undefined,

  EDIT_INGREDIENT_GROUP: undefined // Payload example: {group: 2, wellName: 'H1' (wellName is optional)}
})
