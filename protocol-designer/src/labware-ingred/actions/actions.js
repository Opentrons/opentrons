// @flow
import { createAction } from 'redux-actions'
import type { Dispatch } from 'redux'

import { selectors } from '../selectors'
import type { DeckSlot, GetState } from '../../types'
import type { IngredInputs } from '../types'

// ===== Labware selector actions =====

export const openAddLabwareModal = createAction<
  'OPEN_ADD_LABWARE_MODAL',
  { slot: DeckSlot }
>('OPEN_ADD_LABWARE_MODAL')

export const closeLabwareSelector = createAction<
  'CLOSE_LABWARE_SELECTOR',
  void
>('CLOSE_LABWARE_SELECTOR')

// ===== Open and close Ingredient Selector modal ====

export const openIngredientSelector = createAction<
  'OPEN_INGREDIENT_SELECTOR',
  string
>('OPEN_INGREDIENT_SELECTOR')

export const closeIngredientSelector = createAction<
  'CLOSE_INGREDIENT_SELECTOR',
  void
>('CLOSE_INGREDIENT_SELECTOR')

// ===== Drill Down on Labware ====

export const drillDownOnLabware = createAction<'DRILL_DOWN_ON_LABWARE', string>(
  'DRILL_DOWN_ON_LABWARE'
)

export const drillUpFromLabware = createAction<'DRILL_UP_FROM_LABWARE', void>(
  'DRILL_UP_FROM_LABWARE'
)

// ==== Create/delete/modify labware =====

export type CreateContainerArgs = {|
  slot?: DeckSlot, // NOTE: if slot is omitted, next available slot will be used.
  labwareDefURI: string,
|}

export type CreateContainerAction = {
  type: 'CREATE_CONTAINER',
  payload: {
    ...CreateContainerArgs,
    slot: DeckSlot,
    id: string,
  },
}

export type DeleteContainerAction = {
  type: 'DELETE_CONTAINER',
  payload: {
    labwareId: string,
  },
}

export const deleteContainer = createAction<
  'DELETE_CONTAINER',
  $PropertyType<DeleteContainerAction, 'payload'>
>('DELETE_CONTAINER')

// ===========

export type SwapSlotContentsAction = {
  type: 'MOVE_DECK_ITEM',
  payload: {
    sourceSlot: DeckSlot,
    destSlot: DeckSlot,
  },
}

// TODO: Ian 2019-01-24 later, this should work on stepId or a range of steps.
// We could follow the pattern of SubstituteStepFormPipettesAction.
export const moveDeckItem = (
  sourceSlot: DeckSlot,
  destSlot: DeckSlot
): SwapSlotContentsAction => ({
  type: 'MOVE_DECK_ITEM',
  payload: { sourceSlot, destSlot },
})

export type DuplicateLabwareAction = {
  type: 'DUPLICATE_LABWARE',
  payload: {
    templateLabwareId: string,
    duplicateLabwareId: string,
    duplicateLabwareNickname: string,
    slot: DeckSlot,
  },
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

export const deleteLiquidGroup = (liquidGroupId: string) => (
  dispatch: Dispatch<DeleteLiquidGroup>,
  getState: GetState
) => {
  const allLiquidGroupsOnDeck = selectors.getLiquidGroupsOnDeck(getState())
  const liquidIsOnDeck = allLiquidGroupsOnDeck.includes(liquidGroupId)
  // TODO: Ian 2018-10-22 we will eventually want to replace
  // this window.confirm with a modal
  const okToDelete = liquidIsOnDeck
    ? global.confirm(
        'This liquid has been placed on the deck, are you sure you want to delete it?'
      )
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

export const setWellContents = (
  payload: SetWellContentsPayload
): SetWellContentsAction => ({
  type: 'SET_WELL_CONTENTS',
  payload,
})

export type SelectLiquidAction = {
  type: 'SELECT_LIQUID_GROUP',
  payload: string,
}

export function selectLiquidGroup(liquidGroupId: string): SelectLiquidAction {
  return {
    type: 'SELECT_LIQUID_GROUP',
    payload: liquidGroupId,
  }
}

export function deselectLiquidGroup() {
  return { type: 'DESELECT_LIQUID_GROUP' }
}

export function createNewLiquidGroup() {
  return { type: 'CREATE_NEW_LIQUID_GROUP_FORM' }
}

export type EditLiquidGroupAction = {|
  type: 'EDIT_LIQUID_GROUP',
  payload: {|
    liquidGroupId: string,
    ...IngredInputs,
  |},
|}

// NOTE: with no ID, a new one is assigned
export const editLiquidGroup = (args: {|
  liquidGroupId: ?string,
  ...IngredInputs,
|}) => (dispatch: Dispatch<EditLiquidGroupAction>, getState: GetState) => {
  const { liquidGroupId, ...payloadArgs } = args // NOTE: separate liquidGroupId for flow to understand unpacking :/
  dispatch({
    type: 'EDIT_LIQUID_GROUP',
    payload: {
      ...payloadArgs,
      liquidGroupId:
        args.liquidGroupId || selectors.getNextLiquidGroupId(getState()),
    },
  })
}
