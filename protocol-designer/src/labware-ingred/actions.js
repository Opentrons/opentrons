// @flow
import {createAction} from 'redux-actions'
import type {Dispatch} from 'redux'

import {selectors} from './reducers'
import {INITIAL_DECK_SETUP_STEP_ID} from '../constants'
import {uuid} from '../utils'
import type {ChangeSavedStepFormAction} from '../steplist/actions'
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

type CreateContainerArgs = {
  slot?: DeckSlot,
  containerType: string,
}

export type CreateContainerAction = {
  type: 'CREATE_CONTAINER',
  payload: {
    ...$Exact<CreateContainerArgs>,
    id: string,
  },
}

export const createContainer = createAction(
  'CREATE_CONTAINER',
  (args: CreateContainerArgs) => ({
    id: `${uuid()}:${args.containerType}`,
    ...args,
  })
)

export type DeleteContainerAction = {
  type: 'DELETE_CONTAINER',
  payload: {
    containerId: string,
    slot: DeckSlot,
    containerType: string,
  },
}
export const deleteContainer = createAction(
  'DELETE_CONTAINER',
  (args: $PropertyType<DeleteContainerAction, 'payload'>) => args
)

export type RenameLabwareAction = {
  type: 'RENAME_LABWARE',
  payload: {
    labwareId: string,
    name: ?string,
  },
}

export const renameLabware = (
  payload: $PropertyType<RenameLabwareAction, 'payload'>
): RenameLabwareAction => ({
  type: 'RENAME_LABWARE',
  payload,
})

// ===========

export type MoveLabware = {
  type: 'MOVE_LABWARE',
  payload: {
    fromSlot: DeckSlot,
    toSlot: DeckSlot,
  },
}

export const moveLabware = (toSlot: DeckSlot) => (dispatch: Dispatch<*>, getState: GetState) => {
  const state = getState()
  const fromSlot = selectors.getSlotToMoveFrom(state)

  // TODO: Ian 2018-12-13 this is a HACK during the refactor.
  // Make this a selector in step-forms/ (and move this action to step-forms/)
  // Also, 'moveLabware' should probably act on labwareId, not slot,
  // especially if labware can share slots in the future
  const prevLabwareLocations = state.stepForms.savedStepForms[INITIAL_DECK_SETUP_STEP_ID] &&
    state.stepForms.savedStepForms[INITIAL_DECK_SETUP_STEP_ID].labwareLocationUpdate
  const allLabwareIds = Object.keys(prevLabwareLocations || {})
  // assumes 1 labware per slot:
  const fromLabwareId: ?string = allLabwareIds.filter(id => prevLabwareLocations[id] === fromSlot)[0]

  if (fromSlot) {
    if (fromLabwareId) {
      const updateInitialDeckSetupStep: ChangeSavedStepFormAction = {
        type: 'CHANGE_SAVED_STEP_FORM',
        payload: {
          stepId: INITIAL_DECK_SETUP_STEP_ID,
          update: {
            labwareLocationUpdate: {
              [fromLabwareId]: toSlot,
            },
          },
        },
      }
      dispatch(updateInitialDeckSetupStep)
    }

    // TODO: Ian 2018-12-13 after step-forms refactor, MOVE_LABWARE can be removed.
    const moveLabwareAction: MoveLabware = {
      type: 'MOVE_LABWARE',
      payload: {fromSlot, toSlot},
    }
    dispatch(moveLabwareAction)
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
