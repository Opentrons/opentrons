// @flow
import {createActions} from 'redux-actions'
import type {Dispatch} from 'redux'
import max from 'lodash/max'
import omit from 'lodash/omit'

import {uuid} from '../utils'
import {selectors} from './reducers'

import {editableIngredFields} from './types'
import type {DeckSlot, IngredInputFields, Wells} from './types'

import type {GetState} from '../types'

// Payload mappers
const xyToSingleWellObj = (x: string, y: string): Wells => ({ [(x + ',' + y)]: [x, y] })

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

// TODO test this thunk
export const editIngredient = (payload: {|copyGroupId: string, ...IngredInputFields|}) => (dispatch: Dispatch<*>, getState: GetState) => {
  const state = getState()
  const container = selectors.selectedContainer(state)
  const allIngredients = selectors.allIngredients(state)

  const isUnchangedClone = allIngredients[payload.copyGroupId] &&
    editableIngredFields.every(field =>
      allIngredients[payload.copyGroupId][field] === payload[field]
    )

  // TODO Ian 2018-02-19 make selector, or factor out as util.
  const nextGroupId = (max(Object.keys(allIngredients).map(id => parseInt(id))) + 1) || 0
  console.log(Object.keys(allIngredients), {nextGroupId})

  const groupId = (isUnchangedClone)
    ? payload.copyGroupId
    : nextGroupId.toString()

  const name = (
    allIngredients[payload.copyGroupId] &&
    allIngredients[payload.copyGroupId].name === payload.name
    )
    ? (payload.name || '') + ' copy' // todo: copy 2, copy 3 etc.
    : payload.name

  return dispatch({
    type: 'EDIT_INGREDIENT',
    payload: {
      ...omit(payload, ['copyGroupId']),
      // if it matches the name of the clone parent, append "copy" to that name
      name,
      containerId: container && container.containerId,
      groupId,
      wells: selectors.selectedWellNames(state), // TODO use locations: [slot]: [selected wells]
      isUnchangedClone
    }
  })
}
