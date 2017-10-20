import { createActions } from 'redux-actions'
import { selectors } from '../reducers'

// Actions
export const {
  openLabwareSelector,
  closeLabwareSelector,

  // openIngredientSelector,
  closeIngredientSelector,

  createContainer,
  deleteContainer,
  modifyContainer,

  preselectWells,
  selectWells,
  deselectWells,

  editModeIngredientGroup,
  deleteIngredientGroup
} = createActions({
  OPEN_LABWARE_SELECTOR: undefined,
  CLOSE_LABWARE_SELECTOR: undefined,

  // OPEN_INGREDIENT_SELECTOR: undefined,
  CLOSE_INGREDIENT_SELECTOR: undefined,

  CREATE_CONTAINER: undefined,
  DELETE_CONTAINER: undefined,
  MODIFY_CONTAINER: undefined, // {containerId, modify: {fieldToModify1: newValue1, fieldToModify2: newValue2}}

  PRESELECT_WELLS: undefined,
  SELECT_WELLS: undefined,
  DESELECT_WELLS: undefined,

  EDIT_MODE_INGREDIENT_GROUP: undefined, // payload => ({...payload, selectedWells: {'0,1': [0, 1]}}),
  // Payload example: {group: 2, wellName: 'H1' (wellName is optional)}
  // TODO: ^^^ get [col, row] from wellName, and wellName from either action.payload.wellName, or ingredients[action.payload.group]
  DELETE_INGREDIENT_GROUP: undefined
})

// Using thunks to get access to the larger state
export const openIngredientSelector = payload => (dispatch, getState) => {
  return dispatch({
    type: 'OPEN_INGREDIENT_SELECTOR',
    payload: selectors.containerById(payload.containerId)(getState())
  })
}

export const editIngredient = payload => (dispatch, getState) => {
  const state = getState()
  const container = selectors.selectedContainer(state)

  return dispatch({
    type: 'EDIT_INGREDIENT',
    payload: {
      ...payload,
      // slotName: selectors.selectedContainerSlot(state),
      containerId: container && container.containerId,
      groupId: selectors.selectedIngredientGroupId(state),
      wells: selectors.selectedWellNames(state) // TODO use locations: [slotName]: [selected wells]
    }
  })
}
