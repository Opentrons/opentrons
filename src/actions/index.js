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

  EDIT_MODE_INGREDIENT_GROUP: payload => ({...payload, selectedWells: {'0,1': [0, 1]}}),
  // Payload example: {group: 2, wellName: 'H1' (wellName is optional)}
  // TODO: ^^^ get [col, row] from wellName, and wellName from either action.payload.wellName, or ingredients[action.payload.group]
  DELETE_INGREDIENT_GROUP: undefined
})

// editIngredient needs access to the larger state, so it's a thunk
export const editIngredient = payload => (dispatch, getState) => {
  const state = getState()
  return dispatch({
    type: 'EDIT_INGREDIENT',
    payload: {
      ...payload,
      slotName: selectors.selectedContainerSlot(state),
      groupId: selectors.selectedIngredientGroupId(state),
      wells: selectors.selectedWellNames(state) // TODO use locations: [slotName]: [selected wells]
    }
  })
}
