// @flow
import {createAction} from 'redux-actions'
import type {Dispatch} from 'redux'

import {selectors} from './reducers'

import type {GetState} from '../types'
import type {IngredInputs} from './types'
import type {DeckSlot} from '@opentrons/components'

type IngredInputsExact = $Exact<IngredInputs>

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

export type RemoveWellsContents = {
  type: 'REMOVE_WELLS_CONTENTS',
  payload: {
    labwareId: string,
    wells: Array<string>,
  },
}

export const removeWellsContents = (
  payload: $PropertyType<RemoveWellsContents, 'payload'>
) => ({
  type: 'REMOVE_WELLS_CONTENTS',
  payload,
})

export type DeleteLiquidGroup = {
  type: 'DELETE_LIQUID_GROUP',
  payload: string, // liquid group id
}

export const deleteLiquidGroup = (liquidGroupId: string) =>
  (dispatch: Dispatch<DeleteLiquidGroup>, getState: GetState) => {
    const allLiquidGroupsOnDeck = selectors.getLiquidGroupsOnDeck(getState())
    const liquidIsOnDeck = allLiquidGroupsOnDeck.includes(liquidGroupId)
    // TODO: Ian 2018-10-22 we will eventually want to replace
    // this window.confirm with a modal
    const okToDelete = liquidIsOnDeck
      ? global.confirm('This liquid has been placed on the deck, are you sure you want to delete it?')
      : true
    if (okToDelete) {
      return dispatch({
        type: 'DELETE_LIQUID_GROUP',
        payload: liquidGroupId,
      })
    }
  }

// NOTE: assumes you want to set a uniform volume of the same liquid in one labware
export type SetWellContentsPayload = {
  liquidGroupId: string,
  labwareId: string,
  wells: Array<string>, // NOTE: order should not be meaningful
  volume: number,
}

export type SetWellContentsAction = {
  type: 'SET_WELL_CONTENTS',
  payload: SetWellContentsPayload,
}

export const setWellContents = (payload: SetWellContentsPayload): SetWellContentsAction => ({
  type: 'SET_WELL_CONTENTS',
  payload,
})

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
    ...IngredInputsExact,
  |},
|}

// NOTE: with no ID, a new one is assigned
export const editLiquidGroup = (
  args: {liquidGroupId: ?string, ...IngredInputsExact}
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
