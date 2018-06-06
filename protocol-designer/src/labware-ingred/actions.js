// @flow
import {createAction} from 'redux-actions'
import type {Dispatch} from 'redux'
import max from 'lodash/max'

import {uuid} from '../utils'
import {selectors} from './reducers'
import wellSelectionSelectors from '../well-selection/selectors'

import type {GetState} from '../types'
import type {IngredInputFields} from './types'
import type {DeckSlot} from '@opentrons/components'

// ===== Labware selector actions =====

export const openLabwareSelector = createAction(
  'OPEN_LABWARE_SELECTOR',
  (args: {slot: string}) => args
)

export const closeLabwareSelector = createAction(
  'CLOSE_LABWARE_SELECTOR',
  () => {}
)

export const setCopyLabwareMode = createAction(
  'SET_COPY_LABWARE_MODE',
  (containerId: string) => containerId
)

// ===== Open and close Ingredient Selector modal ====

export const openIngredientSelector = createAction(
  'OPEN_INGREDIENT_SELECTOR',
  (containerId: string) => containerId
)

export const closeIngredientSelector = createAction(
  'CLOSE_INGREDIENT_SELECTOR',
  () => {}
)

// =====

export const editModeIngredientGroup = createAction(
  'EDIT_MODE_INGREDIENT_GROUP',
  (args: (
    | null // null here means "deselect ingredient group"
    | {| wellName: ?string, groupId: string |}
  )) => args
)

// ==== Create/delete/modify labware =====

export const createContainer = createAction(
  'CREATE_CONTAINER',
  (args: {|
    slot: string,
    containerType: string
  |}) => args
)

export const deleteContainer = createAction(
  'DELETE_CONTAINER',
  (args: {|
    containerId: string,
    slot: string,
    containerType: string
  |}) => args
)

export const modifyContainer = createAction(
  'MODIFY_CONTAINER',
  (args: {|
    containerId: string,
    modify: {
      // TODO Ian 2018-02-20: `field` is some 'LabwareField' type
      [field: string]: mixed // eg modify = {name: 'newName'}
    }
  |}) => args
)

export const openRenameLabwareForm = createAction(
  'OPEN_RENAME_LABWARE_FORM',
  () => {}
)

export const closeRenameLabwareForm = createAction(
  'CLOSE_RENAME_LABWARE_FORM',
  () => {}
)

// ===========

export type CopyLabware = {
  type: 'COPY_LABWARE',
  payload: {
    fromContainer: string,
    toContainer: string,
    toSlot: DeckSlot
  }
}

export const copyLabware = (slot: DeckSlot) => (dispatch: Dispatch<CopyLabware>, getState: GetState) => {
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
      // So you get 'uuid:containerType', or 'uuid:undefined' if you're cloning 'FIXED_TRASH_ID'.
      toSlot: slot
    }
  })
}

type DeleteIngredientPrepayload = {
  wellName?: string,
  groupId: string
}

export type DeleteIngredient = {|
  type: 'DELETE_INGREDIENT',
  payload: {
    containerId: string
  } & DeleteIngredientPrepayload
|}

export const deleteIngredient = (payload: DeleteIngredientPrepayload) => (dispatch: Dispatch<DeleteIngredient>, getState: GetState) => {
  const container = selectors.getSelectedContainer(getState())
  if (!container || !container.id) {
    console.warn('Tried to delete ingredient with no selected container')
    return null
  }

  return dispatch({
    type: 'DELETE_INGREDIENT',
    payload: {
      ...payload,
      containerId: container.id
    }
  })
}

// TODO test this thunk
export type EditIngredient = {
  type: 'EDIT_INGREDIENT',
  payload: {
    ...IngredInputFields,
    containerId: string,
    groupId: string,
    wells: Array<string>,
  }
}

export type EditIngredientPayload = {
  ...IngredInputFields,
  groupId: string | null,
  copyGroupId: string | null
}

export const editIngredient = (payload: EditIngredientPayload) => (dispatch: Dispatch<EditIngredient>, getState: GetState) => {
  const state = getState()
  const container = selectors.getSelectedContainer(state)
  const allIngredients = selectors.getIngredientGroups(state)

  const {groupId, copyGroupId, ...inputFields} = payload

  if (!container) {
    throw new Error('No container selected, cannot edit ingredient')
  }

  if (groupId && copyGroupId === null) {
    // Not a copy, just an edit
    return dispatch({
      type: 'EDIT_INGREDIENT',
      payload: {
        ...inputFields,
        groupId: groupId,
        containerId: container.id,
        wells: wellSelectionSelectors.selectedWellNames(state)
      }
    })
  }

  const isUnchangedClone = copyGroupId !== null &&
    allIngredients[copyGroupId] &&
    allIngredients[copyGroupId].name === payload.name

  // TODO Ian 2018-02-19 make selector
  const nextGroupId: string = ((max(Object.keys(allIngredients).map(id => parseInt(id))) + 1) || 0).toString()

  const name = (
    copyGroupId &&
    allIngredients[copyGroupId] &&
    allIngredients[copyGroupId].name === payload.name
    )
    ? (payload.name || '') + ' copy' // todo: copy 2, copy 3 etc.
    : payload.name

  return dispatch({
    type: 'EDIT_INGREDIENT',
    payload: {
      ...inputFields,
      // if it matches the name of the clone parent, append "copy" to that name
      name,
      containerId: container.id,
      groupId: (isUnchangedClone && copyGroupId) ? copyGroupId : nextGroupId,
      wells: wellSelectionSelectors.selectedWellNames(state) // TODO use locations: [slot]: [selected wells]
    }
  })
}
