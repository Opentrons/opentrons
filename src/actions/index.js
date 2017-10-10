import { createActions } from 'redux-actions'

console.log({createActions})

export const {
  openLabwareSelector,
  closeLabwareSelector,

  openIngredientSelector,
  closeIngredientSelector,

  selectLabwareToAdd,

  deleteContainerAtSlot
} = createActions({
  OPEN_LABWARE_SELECTOR: undefined,
  CLOSE_LABWARE_SELECTOR: undefined,

  OPEN_INGREDIENT_SELECTOR: undefined,
  CLOSE_INGREDIENT_SELECTOR: undefined,

  SELECT_LABWARE_TO_ADD: undefined,

  DELETE_CONTAINER_AT_SLOT: undefined
})
