// @flow
import { createAction } from 'redux-actions'

import { selectors } from '../selectors'

import type { DeckSlot, ThunkAction } from '../../types'
import type { IngredInputs } from '../types'

// ===== Labware selector actions =====

export type OpenAddLabwareModalAction = {|
  type: 'OPEN_ADD_LABWARE_MODAL',
  payload: {| slot: DeckSlot |},
|}

export const openAddLabwareModal: (payload: {|
  slot: DeckSlot,
  // $FlowFixMe(mc, 2020-06-04): creatActions doesn't return exact actions
|}) => OpenAddLabwareModalAction = createAction('OPEN_ADD_LABWARE_MODAL')

export type CloseLabwareSelectorAction = {|
  type: 'CLOSE_LABWARE_SELECTOR',
|}

// $FlowFixMe(mc, 2020-06-04): creatActions doesn't return exact actions
export const closeLabwareSelector: () => CloseLabwareSelectorAction = createAction(
  'CLOSE_LABWARE_SELECTOR'
)

// ===== Open and close Ingredient Selector modal ====

export type OpenIngredientSelectorAction = {|
  type: 'OPEN_INGREDIENT_SELECTOR',
  payload: string,
|}

export const openIngredientSelector: (
  payload: string
  // $FlowFixMe(mc, 2020-06-04): creatActions doesn't return exact actions
) => OpenIngredientSelectorAction = createAction('OPEN_INGREDIENT_SELECTOR')

export type CloseIngredientSelectorAction = {|
  type: 'CLOSE_INGREDIENT_SELECTOR',
|}

// $FlowFixMe(mc, 2020-06-04): creatActions doesn't return exact actions
export const closeIngredientSelector: () => CloseIngredientSelectorAction = createAction(
  'CLOSE_INGREDIENT_SELECTOR'
)

// ===== Drill Down on Labware ====

export type DrillDownOnLabwareAction = {|
  type: 'DRILL_DOWN_ON_LABWARE',
  payload: string,
|}

export const drillDownOnLabware: (
  payload: string
  // $FlowFixMe(mc, 2020-06-04): creatActions doesn't return exact actions
) => DrillDownOnLabwareAction = createAction('DRILL_DOWN_ON_LABWARE')

export type DrillUpFromLabwareAction = {|
  type: 'DRILL_UP_FROM_LABWARE',
|}

// $FlowFixMe(mc, 2020-06-04): creatActions doesn't return exact actions
export const drillUpFromLabware: () => DrillUpFromLabwareAction = createAction(
  'DRILL_UP_FROM_LABWARE'
)

// ==== Create/delete/modify labware =====

export type CreateContainerArgs = {|
  slot?: DeckSlot, // NOTE: if slot is omitted, next available slot will be used.
  labwareDefURI: string,
|}

export type CreateContainerAction = {|
  type: 'CREATE_CONTAINER',
  payload: {|
    ...CreateContainerArgs,
    slot: DeckSlot,
    id: string,
  |},
|}

export type DeleteContainerAction = {|
  type: 'DELETE_CONTAINER',
  payload: {| labwareId: string |},
|}

export const deleteContainer: (payload: {|
  labwareId: string,
  // $FlowFixMe(mc, 2020-06-04): creatActions doesn't return exact actions
|}) => DeleteContainerAction = createAction('DELETE_CONTAINER')

// ===========

export type SwapSlotContentsAction = {|
  type: 'MOVE_DECK_ITEM',
  payload: {|
    sourceSlot: DeckSlot,
    destSlot: DeckSlot,
  |},
|}

// TODO: Ian 2019-01-24 later, this should work on stepId or a range of steps.
// We could follow the pattern of SubstituteStepFormPipettesAction.
export const moveDeckItem = (
  sourceSlot: DeckSlot,
  destSlot: DeckSlot
): SwapSlotContentsAction => ({
  type: 'MOVE_DECK_ITEM',
  payload: { sourceSlot, destSlot },
})

export type DuplicateLabwareAction = {|
  type: 'DUPLICATE_LABWARE',
  payload: {|
    templateLabwareId: string,
    duplicateLabwareId: string,
    duplicateLabwareNickname: string,
    slot: DeckSlot,
  |},
|}

export type RemoveWellsContentsAction = {|
  type: 'REMOVE_WELLS_CONTENTS',
  payload: {|
    labwareId: string,
    liquidGroupId?: string,
    wells: Array<string>,
  |},
|}

export const removeWellsContents: (
  payload: $PropertyType<RemoveWellsContentsAction, 'payload'>
) => RemoveWellsContentsAction = payload => ({
  type: 'REMOVE_WELLS_CONTENTS',
  payload,
})

export type DeleteLiquidGroupAction = {|
  type: 'DELETE_LIQUID_GROUP',
  payload: string, // liquid group id
|}

export const deleteLiquidGroup: (
  liquidGroupId: string
) => ThunkAction<DeleteLiquidGroupAction> = liquidGroupId => (
  dispatch,
  getState
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
export type SetWellContentsPayload = {|
  liquidGroupId: string,
  labwareId: string,
  wells: Array<string>, // NOTE: order should not be meaningful
  volume: number,
|}

export type SetWellContentsAction = {|
  type: 'SET_WELL_CONTENTS',
  payload: SetWellContentsPayload,
|}

export const setWellContents = (
  payload: SetWellContentsPayload
): SetWellContentsAction => ({
  type: 'SET_WELL_CONTENTS',
  payload,
})

export type SelectLiquidAction = {|
  type: 'SELECT_LIQUID_GROUP',
  payload: string,
|}

export function selectLiquidGroup(liquidGroupId: string): SelectLiquidAction {
  return {
    type: 'SELECT_LIQUID_GROUP',
    payload: liquidGroupId,
  }
}

export type DeselectLiquidGroupAction = {| type: 'DESELECT_LIQUID_GROUP' |}

export function deselectLiquidGroup(): DeselectLiquidGroupAction {
  return { type: 'DESELECT_LIQUID_GROUP' }
}

export type CreateNewLiquidGroupAction = {|
  type: 'CREATE_NEW_LIQUID_GROUP_FORM',
|}

export function createNewLiquidGroup(): CreateNewLiquidGroupAction {
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
export const editLiquidGroup: (args: {|
  liquidGroupId: ?string,
  ...IngredInputs,
|}) => ThunkAction<EditLiquidGroupAction> = args => (dispatch, getState) => {
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
