// @flow
import {createAction} from 'redux-actions'
import type {Dispatch} from 'redux'
import max from 'lodash/max'

import {uuid} from '../utils'
import {selectors} from './reducers'
import wellSelectionSelectors from '../well-selection/selectors'

import type {GetState} from '../types'
import {editableIngredFields} from './types'
import type {IngredInputFields, Wells} from './types'
import type {DeckSlot, Channels} from '@opentrons/components'

// Payload mappers
const xyToSingleWellObj = (x: string, y: string): Wells => ({ [(x + ',' + y)]: [x, y] })

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
    | {| wellName: string, groupId: string |}
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

// ===== Preselect / select wells in plate

type WellSelectionPayload = {|
  wells: Wells,
  labwareType: string,
  pipetteChannels: Channels
|}

const _wellSelectPayloadMapper = (
  args: WellSelectionPayload
): WellSelectionPayload => args

export const highlightWells = createAction(
  'HIGHLIGHT_WELLS',
  _wellSelectPayloadMapper
)

export const selectWells = createAction(
  'SELECT_WELLS',
  _wellSelectPayloadMapper
)

export const deselectWells = createAction(
  'DESELECT_WELLS',
  _wellSelectPayloadMapper
)

// ===== well hovering =====
export const hoverWellBegin = createAction(
  'HOVER_WELL_BEGIN',
  xyToSingleWellObj
)

export const hoverWellEnd = createAction(
  'HOVER_WELL_END',
  xyToSingleWellObj
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

type DeleteIngredientPrepayload = {|
  wellName?: string,
  groupId: string
|}

export type DeleteIngredient = {|
  type: 'DELETE_INGREDIENT',
  payload: {
    ...DeleteIngredientPrepayload,
    containerId: string
  }
|}

export const deleteIngredient = (payload: DeleteIngredientPrepayload) => (dispatch: Dispatch<DeleteIngredient>, getState: GetState) => {
  const container = selectors.selectedContainer(getState())
  if (!container || !container.containerId) {
    console.warn('Tried to delete ingredient with no selected container')
    return null
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
export type EditIngredient = {
  type: 'EDIT_INGREDIENT',
  payload: {
    name: string,
    containerId: string,
    groupId: string,
    wells: Array<string>,
    isUnchangedClone: boolean,
    ...IngredInputFields
  }
}

export const editIngredient = (payload: {|
  ...IngredInputFields,
  groupId: string | null,
  copyGroupId: string | null
|}) => (dispatch: Dispatch<EditIngredient>, getState: GetState) => {
  const state = getState()
  const container = selectors.selectedContainer(state)
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
        containerId: container.containerId,
        wells: wellSelectionSelectors.selectedWellNames(state),
        isUnchangedClone: true
      }
    })
  }

  const isUnchangedClone = copyGroupId !== null &&
    allIngredients[copyGroupId] &&
    editableIngredFields.every(field =>
      allIngredients[copyGroupId][field] === payload[field]
    )

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
      containerId: container && container.containerId,
      groupId: (isUnchangedClone && copyGroupId) ? copyGroupId : nextGroupId,
      wells: wellSelectionSelectors.selectedWellNames(state), // TODO use locations: [slot]: [selected wells]
      isUnchangedClone
    }
  })
}
