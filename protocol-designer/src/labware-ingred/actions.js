// @flow
import {createAction} from 'redux-actions'
import type {Dispatch} from 'redux'

import {selectors} from './reducers'
import wellSelectionSelectors from '../well-selection/selectors'

import type {GetState} from '../types'
import type {IngredInputs} from './types'
import type {DeckSlot} from '@opentrons/components'

type IngredInputFields = $Exact<IngredInputs>

// ===== Labware selector actions =====

export const openAddLabwareModal = createAction(
  'OPEN_ADD_LABWARE_MODAL',
  (args: {slot: DeckSlot}) => args
)

export const closeLabwareSelector = createAction(
  'CLOSE_LABWARE_SELECTOR',
  () => {}
)

export const setMoveLabwareMode = createAction(
  'SET_MOVE_LABWARE_MODE',
  (slot: ?DeckSlot) => slot
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

// ===== Drill Down on Labware ====

export const drillDownOnLabware = createAction(
  'DRILL_DOWN_ON_LABWARE',
  (labwareId: string) => labwareId
)

export const drillUpFromLabware = createAction(
  'DRILL_UP_FROM_LABWARE',
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
    slot: DeckSlot,
    containerType: string,
  |}) => args
)

export const deleteContainer = createAction(
  'DELETE_CONTAINER',
  (args: {|
    containerId: string,
    slot: DeckSlot,
    containerType: string,
  |}) => args
)

export const modifyContainer = createAction(
  'MODIFY_CONTAINER',
  (args: {|
    containerId: string,
    modify: {
      // TODO Ian 2018-02-20: `field` is some 'LabwareField' type
      [field: string]: mixed, // eg modify = {name: 'newName'}
    },
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

export type MoveLabware = {
  type: 'MOVE_LABWARE',
  payload: {
    fromSlot: DeckSlot,
    toSlot: DeckSlot,
  },
}

export const moveLabware = (toSlot: DeckSlot) => (dispatch: Dispatch<MoveLabware>, getState: GetState) => {
  const state = getState()
  const fromSlot = selectors.slotToMoveFrom(state)
  if (fromSlot) {
    return dispatch({
      type: 'MOVE_LABWARE',
      payload: {fromSlot, toSlot},
    })
  }
}

type DeleteIngredientPrepayload = {
  wellName?: string,
  groupId: string,
}

export type DeleteIngredient = {|
  type: 'DELETE_INGREDIENT',
  payload: {
    containerId: string,
  } & DeleteIngredientPrepayload,
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
      containerId: container.id,
    },
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
  },
}

export type EditIngredientPayload = {
  ...IngredInputFields,
  groupId: string | null, // null indicates new ingredient is being created
}

// TODO: Ian 2018-10-12 this is deprecated, remove when "add liquids to deck" modal is redone
export const editIngredient = (payload: EditIngredientPayload) => (dispatch: Dispatch<EditIngredient>, getState: GetState) => {
  const state = getState()
  const container = selectors.getSelectedContainer(state)

  const {groupId, ...inputFields} = payload

  if (!container) {
    throw new Error('No container selected, cannot edit ingredient')
  }

  if (groupId !== null) {
    // Not a copy, just an edit
    return dispatch({
      type: 'EDIT_INGREDIENT',
      payload: {
        ...inputFields,
        groupId: groupId,
        containerId: container.id,
        wells: wellSelectionSelectors.selectedWellNames(state),
      },
    })
  }

  return dispatch({
    type: 'EDIT_INGREDIENT',
    payload: {
      ...inputFields,
      // if it matches the name of the clone parent, append "copy" to that name
      containerId: container.id,
      groupId: selectors.getNextLiquidGroupId(state),
      wells: wellSelectionSelectors.selectedWellNames(state),
    },
  })
}

export type SelectLiquidAction = {
  type: 'SELECT_LIQUID_GROUP',
  payload: string,
}

export function selectLiquidGroup (liquidGroupId: string): SelectLiquidAction {
  return {
    type: 'SELECT_LIQUID_GROUP',
    payload: liquidGroupId,
  }
}

export function deselectLiquidGroup () {
  return {type: 'DESELECT_LIQUID_GROUP'}
}

export function createNewLiquidGroup () {
  return {type: 'CREATE_NEW_LIQUID_GROUP_FORM'}
}

export type EditLiquidGroupAction = {|
  type: 'EDIT_LIQUID_GROUP',
  payload: {|
    liquidGroupId: string,
    ...IngredInputFields,
  |},
|}

// NOTE: with no ID, a new one is assigned
export const editLiquidGroup = (
  args: {liquidGroupId: ?string, ...IngredInputFields}
) => (dispatch: Dispatch<EditLiquidGroupAction>, getState: GetState
) => {
  const {liquidGroupId, ...payloadArgs} = args // NOTE: separate liquidGroupId for flow to understand unpacking :/
  dispatch({
    type: 'EDIT_LIQUID_GROUP',
    payload: {
      ...payloadArgs,
      liquidGroupId: args.liquidGroupId || selectors.getNextLiquidGroupId(getState()),
    },
  })
}
