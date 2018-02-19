// @flow
import {createActions} from 'redux-actions'
import {uuid} from '../utils'
import {selectors} from './reducers'

import type {Dispatch} from 'redux'
import type {DeckSlot, IngredInputFields} from './types'
import type {GetState} from '../types'

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

export const copyLabware = (slot: DeckSlot) => (dispatch: Dispatch<*>, getState: GetState) => {
  const state = getState()
  const fromContainer = selectors.labwareToCopy(state)
  if (fromContainer === false) {
    console.warn('Attempted to copy labware with no fromContainer')
    return
  }
  return dispatch({
    type: 'COPY_LABWARE',
    payload: {
      fromContainer,
      toContainer: uuid() + ':' + fromContainer.split(':')[1],
      // 'toContainer' is the containerId of the new clone.
      // So you get 'uuid:containerType', or 'uuid:undefined' if you're cloning 'default-trash'.
      toSlot: slot
    }
  })
}

export const deleteIngredient = (payload: {|wellName?: string, groupId: string|}) => (dispatch: Dispatch<*>, getState: GetState) => {
  const container = selectors.selectedContainer(getState())
  if (!container || !container.containerId) {
    console.warn('Tried to delete ingredient with no selected container')
    return
  }

  return dispatch({
    type: 'DELETE_INGREDIENT',
    payload: {
      ...payload,
      containerId: container.containerId
    }
  })
}

export const editIngredient = (payload: {|copyGroupId: string, ...IngredInputFields|}) => (dispatch: Dispatch<*>, getState: GetState) => {
  const state = getState()
  const container = selectors.selectedContainer(state)

  return dispatch({
    type: 'EDIT_INGREDIENT',
    payload: {
      ...payload,
      // slot: selectors.selectedContainerSlot(state),
      containerId: container && container.containerId,
      groupId: selectors.selectedIngredientGroupId(state),
      wells: selectors.selectedWellNames(state) // TODO use locations: [slot]: [selected wells]
    }
  })
}
