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

export type SelectableItem =
  | {
      isStep: true,
      id: StepIdType,
    }
  | {
      isStep: false,
      id: TerminalItemId,
    }

type SelectedItemState = ?SelectableItem

function stepIdHelper(id: ?StepIdType): SelectedItemState {
  if (id == null) return null
  return { isStep: true, id }
}

function terminalItemIdHelper(id: ?TerminalItemId): SelectedItemState {
  if (id == null) return null
  return { isStep: false, id }
}

export const initialSelectedItemState = {
  isStep: false,
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
  },
  initialSelectedItemState
)

type HoveredItemState = SelectedItemState

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
