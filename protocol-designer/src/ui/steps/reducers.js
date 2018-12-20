// @flow
import {combineReducers} from 'redux'
import {handleActions} from 'redux-actions'
import type {ActionType, Reducer} from 'redux-actions'
import omit from 'lodash/omit'

import {getPDMetadata} from '../../file-types'

import type {LoadFileAction} from '../../load-file'
import type {StepIdType, FormModalFields} from '../../form-types'
import {START_TERMINAL_ITEM_ID, type SubstepIdentifier, type TerminalItemId} from '../../steplist/types'
import type {
  AddStepAction,
  DeleteStepAction,
} from '../../steplist/actions'

import {
  hoverOnSubstep,
  hoverOnStep,
  hoverOnTerminalItem,
  toggleStepCollapsed,
  type SelectStepAction,
  type SelectTerminalItemAction,
  type ChangeMoreOptionsModalInputAction,
  type OpenMoreOptionsModalAction,
} from './actions'

// the form modal (MORE OPTIONS) is an unsaved version of unsavedForm.
// It's 2 degrees away from actual savedStepForms.
const unsavedFormModal = handleActions({
  OPEN_MORE_OPTIONS_MODAL: (state, action: OpenMoreOptionsModalAction) => action.payload,
  CHANGE_MORE_OPTIONS_MODAL_INPUT: (state, action: ChangeMoreOptionsModalInputAction) =>
    ({...state, ...action.payload.update}),
  CANCEL_MORE_OPTIONS_MODAL: () => null,
  SAVE_MORE_OPTIONS_MODAL: () => null,
  DELETE_STEP: () => null,
}, null)

type CollapsedStepsState = {[StepIdType]: boolean}
const collapsedSteps: Reducer<CollapsedStepsState, *> = handleActions({
  ADD_STEP: (state: CollapsedStepsState, action: AddStepAction) => ({
    ...state,
    [action.payload.id]: false,
  }),
  DELETE_STEP: (state: CollapsedStepsState, action: DeleteStepAction) =>
    omit(state, action.payload.toString()),
  TOGGLE_STEP_COLLAPSED: (state: CollapsedStepsState, {payload}: ActionType<typeof toggleStepCollapsed>) => ({
    ...state,
    [payload]: !state[payload],
  }),
  LOAD_FILE: (state: CollapsedStepsState, action: LoadFileAction) =>
    // default all steps to collapsed
    getPDMetadata(action.payload).orderedSteps.reduce(
      (acc: CollapsedStepsState, stepId) => ({...acc, [stepId]: true}),
      {}
    ),
}, {})

export type SelectableItem = {
  isStep: true,
  id: StepIdType,
} | {
  isStep: false,
  id: TerminalItemId,
}

type SelectedItemState = ?SelectableItem

function stepIdHelper (id: ?StepIdType): SelectedItemState {
  if (id == null) return null
  return {isStep: true, id}
}

function terminalItemIdHelper (id: ?TerminalItemId): SelectedItemState {
  if (id == null) return null
  return {isStep: false, id}
}

export const initialSelectedItemState = {isStep: false, id: START_TERMINAL_ITEM_ID}

const selectedItem: Reducer<SelectedItemState, *> = handleActions({
  SELECT_STEP: (state: SelectedItemState, action: SelectStepAction) => stepIdHelper(action.payload),
  SELECT_TERMINAL_ITEM: (state: SelectedItemState, action: SelectTerminalItemAction) => (
    terminalItemIdHelper(action.payload)
  ),
  DELETE_STEP: () => null,
}, initialSelectedItemState)

type HoveredItemState = SelectedItemState

const hoveredItem: Reducer<HoveredItemState, *> = handleActions({
  HOVER_ON_STEP: (state: HoveredItemState, action: ActionType<typeof hoverOnStep>) => (
    stepIdHelper(action.payload)
  ),
  HOVER_ON_TERMINAL_ITEM: (state: HoveredItemState, action: ActionType<typeof hoverOnTerminalItem>) => (
    terminalItemIdHelper(action.payload)
  ),
}, null)

const hoveredSubstep = handleActions({
  HOVER_ON_SUBSTEP: (state: SubstepIdentifier, action: ActionType<typeof hoverOnSubstep>) => action.payload,
}, null)

const wellSelectionLabwareKey = handleActions({
  SET_WELL_SELECTION_LABWARE_KEY: (state, action: {payload: string}) => action.payload,
  CLEAR_WELL_SELECTION_LABWARE_KEY: () => null,
}, null)

export type StepsState = {|
  unsavedFormModal: FormModalFields,
  collapsedSteps: CollapsedStepsState,
  selectedItem: SelectedItemState,
  hoveredItem: HoveredItemState,
  hoveredSubstep: SubstepIdentifier,
  wellSelectionLabwareKey: ?string,
|}

export const _allReducers = {
  unsavedFormModal,
  collapsedSteps,
  selectedItem,
  hoveredItem,
  hoveredSubstep,
  wellSelectionLabwareKey,
}

const rootReducer = combineReducers(_allReducers)

export default rootReducer
