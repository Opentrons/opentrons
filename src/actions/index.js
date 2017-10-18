import { createActions } from 'redux-actions'
import { selectors } from '../reducers'

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

  editModeIngredientGroup,
  // editIngredient,
  deleteIngredientGroup
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

  EDIT_MODE_INGREDIENT_GROUP: undefined, // Payload example: {group: 2, wellName: 'H1' (wellName is optional)}
  DELETE_INGREDIENT_GROUP: undefined
})

// editIngredient needs access to the larger state, so it's a thunk
export const editIngredient = payload => (dispatch, getState) => (dispatch({
  type: 'EDIT_INGREDIENT',
  payload: {
    ...payload,
    slotName: selectors.selectedContainerSlot(getState())
  }
}))
