import { createActions } from 'redux-actions'
import { selectors } from './reducers'
import { uuid } from '../utils.js'

// Payload mappers
const xyToSingleWellObj = (x, y) => ({ [(x + ',' + y)]: [x, y] })

// Actions
export const {
  openLabwareSelector,
  closeLabwareSelector,

  openIngredientSelector,
  closeIngredientSelector,

  setCopyLabwareMode,

  createContainer,
  deleteContainer,
  modifyContainer,

  preselectWells,
  selectWells,
  deselectWells,

  editModeIngredientGroup,

  hoverWellBegin,
  hoverWellEnd
  // deleteIngredient
} = createActions({
  OPEN_LABWARE_SELECTOR: undefined,
  CLOSE_LABWARE_SELECTOR: undefined,

  OPEN_INGREDIENT_SELECTOR: undefined,
  CLOSE_INGREDIENT_SELECTOR: undefined,

  SET_COPY_LABWARE_MODE: undefined, // payload is containerId

  CREATE_CONTAINER: undefined,
  DELETE_CONTAINER: undefined,
  MODIFY_CONTAINER: undefined, // {containerId, modify: {fieldToModify1: newValue1, fieldToModify2: newValue2}}

  PRESELECT_WELLS: undefined,
  SELECT_WELLS: undefined,
  DESELECT_WELLS: undefined,

  EDIT_MODE_INGREDIENT_GROUP: undefined, // payload => ({...payload, selectedWells: {'0,1': [0, 1]}}),
  // Payload example: {group: 2, wellName: 'H1' (wellName is optional)}
  // TODO: ^^^ get [col, row] from wellName, and wellName from either action.payload.wellName, or ingredients[action.payload.group]
  // DELETE_INGREDIENT: undefined

  HOVER_WELL_BEGIN: xyToSingleWellObj,
  HOVER_WELL_END: xyToSingleWellObj
})

export const copyLabware = slotName => (dispatch, getState) => {
  const state = getState()
  const fromContainer = selectors.labwareToCopy(state)
  return dispatch({
    type: 'COPY_LABWARE',
    payload: {
      fromContainer,
      toContainer: uuid() + ':' + fromContainer.split(':')[1],
      // 'toContainer' is the containerId of the new clone.
      // So you get 'uuid:containerType', or 'uuid:undefined' if you're cloning 'default-trash'.
      toSlot: slotName
    }
  })
}

export const deleteIngredient = payload => (dispatch, getState) => {
  return dispatch({
    type: 'DELETE_INGREDIENT',
    payload: {
      ...payload,
      containerId: selectors.selectedContainer(getState()).containerId
    }
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
