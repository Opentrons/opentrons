// @flow
import { combineReducers, type Reducer } from 'redux'
import { handleActions } from 'redux-actions'
import omit from 'lodash/omit'
import { getPDMetadata } from '../../file-types'
import {
  START_TERMINAL_ITEM_ID,
  PRESAVED_STEP_ID,
  type SubstepIdentifier,
  type TerminalItemId,
} from '../../steplist/types'
import type { Action } from '../../types'
import type { LoadFileAction } from '../../load-file'
import type { StepIdType } from '../../form-types'
import type { SaveStepFormAction } from '../steps/actions/thunks'
import type { DeleteStepAction } from '../../steplist/actions'
import type {
  AddStepAction,
  HoverOnStepAction,
  HoverOnSubstepAction,
  HoverOnTerminalItemAction,
  SelectStepAction,
  SelectMultipleStepsAction,
  SelectTerminalItemAction,
  ToggleStepCollapsedAction,
} from './actions/types'

export type CollapsedStepsState = { [StepIdType]: boolean }

const collapsedSteps: Reducer<CollapsedStepsState, *> = handleActions(
  {
    SAVE_STEP_FORM: (
      state: CollapsedStepsState,
      action: SaveStepFormAction
    ) => {
      const id = action.payload.id
      if (!(id in state)) {
        // if step saved for the first time, initialize collapsed state
        return { ...state, [id]: false }
      }
      return state
    },
    DELETE_STEP: (state: CollapsedStepsState, action: DeleteStepAction) =>
      omit(state, action.payload.toString()),
    TOGGLE_STEP_COLLAPSED: (
      state: CollapsedStepsState,
      { payload }: ToggleStepCollapsedAction
    ) => ({
      ...state,
      [payload]: !state[payload],
    }),
    LOAD_FILE: (state: CollapsedStepsState, action: LoadFileAction) =>
      // default all steps to collapsed
      getPDMetadata(action.payload.file).orderedStepIds.reduce(
        (acc: CollapsedStepsState, stepId) => ({ ...acc, [stepId]: true }),
        {}
      ),
  },
  {}
)

export const SINGLE_STEP_SELECTION_TYPE: 'SINGLE_STEP_SELECTION_TYPE' =
  'SINGLE_STEP_SELECTION_TYPE'
export const MULTI_STEP_SELECTION_TYPE: 'MULTI_STEP_SELECTION_TYPE' =
  'MULTI_STEP_SELECTION_TYPE'
export const TERMINAL_ITEM_SELECTION_TYPE: 'TERMINAL_ITEM_SELECTION_TYPE' =
  'TERMINAL_ITEM_SELECTION_TYPE'

type SingleSelectedItem = {|
  selectionType: typeof SINGLE_STEP_SELECTION_TYPE,
  id: StepIdType,
|}

type MultipleSelectedItem = {|
  selectionType: typeof MULTI_STEP_SELECTION_TYPE,
  ids: Array<StepIdType>,
  lastSelected: StepIdType,
|}

type TerminalItem = {|
  selectionType: typeof TERMINAL_ITEM_SELECTION_TYPE,
  id: TerminalItemId,
|}
export type SelectableItem =
  | SingleSelectedItem
  | MultipleSelectedItem
  | TerminalItem

type SelectedItemState = ?SelectableItem

export type HoverableItem = SingleSelectedItem | TerminalItem

function stepIdHelper(id: ?StepIdType): SingleSelectedItem | null {
  if (id == null) return null
  return { selectionType: SINGLE_STEP_SELECTION_TYPE, id }
}

function terminalItemIdHelper(id: ?TerminalItemId): TerminalItem | null {
  if (id == null) return null
  return { selectionType: TERMINAL_ITEM_SELECTION_TYPE, id }
}

export const initialSelectedItemState = {
  selectionType: TERMINAL_ITEM_SELECTION_TYPE,
  id: START_TERMINAL_ITEM_ID,
}

const selectedItem: Reducer<SelectedItemState, *> = handleActions(
  {
    ADD_STEP: (state: SelectedItemState, action: AddStepAction) =>
      terminalItemIdHelper(PRESAVED_STEP_ID),
    SAVE_STEP_FORM: (state: SelectedItemState, action: SaveStepFormAction) => {
      return stepIdHelper(action.payload.id)
    },
    SELECT_STEP: (state: SelectedItemState, action: SelectStepAction) =>
      stepIdHelper(action.payload),
    SELECT_TERMINAL_ITEM: (
      state: SelectedItemState,
      action: SelectTerminalItemAction
    ) => terminalItemIdHelper(action.payload),
    DELETE_STEP: () => null,
    SELECT_MULTIPLE_STEPS: (
      state: SelectedItemState,
      action: SelectMultipleStepsAction
    ) => ({
      selectionType: MULTI_STEP_SELECTION_TYPE,
      ids: action.payload.stepIds,
      lastSelected: action.payload.lastSelected,
    }),
  },
  initialSelectedItemState
)

type HoveredItemState = HoverableItem | null

const hoveredItem: Reducer<HoveredItemState, *> = handleActions(
  {
    HOVER_ON_STEP: (state: HoveredItemState, action: HoverOnStepAction) =>
      stepIdHelper(action.payload),
    HOVER_ON_TERMINAL_ITEM: (
      state: HoveredItemState,
      action: HoverOnTerminalItemAction
    ) => terminalItemIdHelper(action.payload),
  },
  null
)

const hoveredSubstep: Reducer<
  SubstepIdentifier,
  HoverOnSubstepAction
> = handleActions(
  {
    HOVER_ON_SUBSTEP: (
      state: SubstepIdentifier,
      action: HoverOnSubstepAction
    ) => action.payload,
  },
  null
)

const wellSelectionLabwareKey: Reducer<string | null, any> = handleActions(
  {
    SET_WELL_SELECTION_LABWARE_KEY: (state, action: { payload: string }) =>
      action.payload,
    CLEAR_WELL_SELECTION_LABWARE_KEY: () => null,
  },
  null
)

export type StepsState = {|
  collapsedSteps: CollapsedStepsState,
  selectedItem: SelectedItemState,
  hoveredItem: HoveredItemState,
  hoveredSubstep: SubstepIdentifier,
  wellSelectionLabwareKey: string | null,
|}

export const _allReducers = {
  collapsedSteps,
  selectedItem,
  hoveredItem,
  hoveredSubstep,
  wellSelectionLabwareKey,
}

export const rootReducer: Reducer<StepsState, Action> = combineReducers(
  _allReducers
)
