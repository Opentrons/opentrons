import { createAction } from 'redux-actions'
import { selectors } from '../selectors'
import { DeckSlot, ThunkAction } from '../../types'
import { IngredInputs } from '../types'
// ===== Labware selector actions =====
export interface OpenAddLabwareModalAction {
  type: 'OPEN_ADD_LABWARE_MODAL'
  payload: {
    slot: DeckSlot
  }
}
// @ts-expect-error(sa, 2021-6-20): creatActions doesn't return exact actions
export const openAddLabwareModal: (payload: {
  slot: DeckSlot
}) => OpenAddLabwareModalAction = createAction('OPEN_ADD_LABWARE_MODAL')
export interface CloseLabwareSelectorAction {
  type: 'CLOSE_LABWARE_SELECTOR'
}
// @ts-expect-error(mc, 2020-06-04): creatActions doesn't return exact actions
export const closeLabwareSelector: () => CloseLabwareSelectorAction = createAction(
  'CLOSE_LABWARE_SELECTOR'
)
// ===== Open and close Ingredient Selector modal ====
export interface OpenIngredientSelectorAction {
  type: 'OPEN_INGREDIENT_SELECTOR'
  payload: string
}
// @ts-expect-error(sa, 2021-6-20): creatActions doesn't return exact actions
export const openIngredientSelector: (
  payload: string
) => OpenIngredientSelectorAction = createAction('OPEN_INGREDIENT_SELECTOR')
export interface CloseIngredientSelectorAction {
  type: 'CLOSE_INGREDIENT_SELECTOR'
}
// @ts-expect-error(mc, 2020-06-04): creatActions doesn't return exact actions
export const closeIngredientSelector: () => CloseIngredientSelectorAction = createAction(
  'CLOSE_INGREDIENT_SELECTOR'
)
// ===== Drill Down on Labware ====
export interface DrillDownOnLabwareAction {
  type: 'DRILL_DOWN_ON_LABWARE'
  payload: string
}
// @ts-expect-error(sa, 2021-6-20): creatActions doesn't return exact actions
export const drillDownOnLabware: (
  payload: string
) => DrillDownOnLabwareAction = createAction('DRILL_DOWN_ON_LABWARE')
export interface DrillUpFromLabwareAction {
  type: 'DRILL_UP_FROM_LABWARE'
}
// @ts-expect-error(mc, 2020-06-04): creatActions doesn't return exact actions
export const drillUpFromLabware: () => DrillUpFromLabwareAction = createAction(
  'DRILL_UP_FROM_LABWARE'
)
// ==== Create/delete/modify labware =====
export interface CreateContainerArgs {
  labwareDefURI: string
  // NOTE: adapterUnderLabwareDefURI is only for rendering an adapter under the labware/tiprack
  adapterUnderLabwareDefURI?: string
  // NOTE: if slot is omitted, next available slot will be used.
  slot?: DeckSlot
}
export interface CreateContainerAction {
  type: 'CREATE_CONTAINER'
  payload: CreateContainerArgs & {
    slot: DeckSlot
    id: string
  }
}
export interface DeleteContainerAction {
  type: 'DELETE_CONTAINER'
  payload: {
    labwareId: string
  }
}
// @ts-expect-error(sa, 2021-6-20): creatActions doesn't return exact actions
export const deleteContainer: (payload: {
  labwareId: string
}) => DeleteContainerAction = createAction('DELETE_CONTAINER')
// ===========
export interface SwapSlotContentsAction {
  type: 'MOVE_DECK_ITEM'
  payload: {
    sourceSlot: DeckSlot
    destSlot: DeckSlot
  }
}
// TODO: Ian 2019-01-24 later, this should work on stepId or a range of steps.
// We could follow the pattern of SubstituteStepFormPipettesAction.
export const moveDeckItem = (
  sourceSlot: DeckSlot,
  destSlot: DeckSlot
): SwapSlotContentsAction => ({
  type: 'MOVE_DECK_ITEM',
  payload: {
    sourceSlot,
    destSlot,
  },
})
export interface DuplicateLabwareAction {
  type: 'DUPLICATE_LABWARE'
  payload: {
    templateLabwareId: string
    duplicateLabwareId: string
    duplicateLabwareNickname: string
    slot: DeckSlot
  }
}
export interface RemoveWellsContentsAction {
  type: 'REMOVE_WELLS_CONTENTS'
  payload: {
    labwareId: string
    liquidGroupId?: string
    wells: string[]
  }
}
export const removeWellsContents: (
  payload: RemoveWellsContentsAction['payload']
) => RemoveWellsContentsAction = payload => ({
  type: 'REMOVE_WELLS_CONTENTS',
  payload,
})
export interface DeleteLiquidGroupAction {
  type: 'DELETE_LIQUID_GROUP'
  payload: string // liquid group id
}
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
export interface SetWellContentsPayload {
  liquidGroupId: string
  labwareId: string
  wells: string[]
  // NOTE: order should not be meaningful
  volume: number
}
export interface SetWellContentsAction {
  type: 'SET_WELL_CONTENTS'
  payload: SetWellContentsPayload
}
export const setWellContents = (
  payload: SetWellContentsPayload
): SetWellContentsAction => ({
  type: 'SET_WELL_CONTENTS',
  payload,
})
export interface SelectLiquidAction {
  type: 'SELECT_LIQUID_GROUP'
  payload: string
}
export function selectLiquidGroup(liquidGroupId: string): SelectLiquidAction {
  return {
    type: 'SELECT_LIQUID_GROUP',
    payload: liquidGroupId,
  }
}
export interface DeselectLiquidGroupAction {
  type: 'DESELECT_LIQUID_GROUP'
}
export function deselectLiquidGroup(): DeselectLiquidGroupAction {
  return {
    type: 'DESELECT_LIQUID_GROUP',
  }
}
export interface CreateNewLiquidGroupAction {
  type: 'CREATE_NEW_LIQUID_GROUP_FORM'
}
export function createNewLiquidGroup(): CreateNewLiquidGroupAction {
  return {
    type: 'CREATE_NEW_LIQUID_GROUP_FORM',
  }
}
export interface EditLiquidGroupAction {
  type: 'EDIT_LIQUID_GROUP'
  payload: IngredInputs & {
    liquidGroupId: string
  }
}
// NOTE: with no ID, a new one is assigned
export const editLiquidGroup: (
  args: IngredInputs & {
    liquidGroupId: string | null | undefined
  }
) => ThunkAction<EditLiquidGroupAction> = args => (dispatch, getState) => {
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
