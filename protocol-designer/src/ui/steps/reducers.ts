import { Reducer, combineReducers } from 'redux'

import { handleActions } from 'redux-actions'
import omit from 'lodash/omit'
import { getPDMetadata } from '../../file-types'
import {
  SubstepIdentifier,
  TerminalItemId,
  START_TERMINAL_ITEM_ID,
  PRESAVED_STEP_ID,
} from '../../steplist/types'

import { Action } from '../../types'
import { LoadFileAction } from '../../load-file'
import { StepIdType } from '../../form-types'
import { SaveStepFormAction } from '../steps/actions/thunks'
import {
  DeleteStepAction,
  DeleteMultipleStepsAction,
} from '../../steplist/actions'
import {
  AddStepAction,
  HoverOnStepAction,
  HoverOnSubstepAction,
  HoverOnTerminalItemAction,
  SelectStepAction,
  SelectMultipleStepsAction,
  SelectTerminalItemAction,
  ToggleStepCollapsedAction,
  ExpandMultipleStepsAction,
  CollapseMultipleStepsAction,
} from './actions/types'
export type CollapsedStepsState = Record<StepIdType, boolean>
// @ts-expect-error(sa, 2021-6-10): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
const collapsedSteps: Reducer<CollapsedStepsState, any> = handleActions(
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
    DELETE_MULTIPLE_STEPS: (
      state: CollapsedStepsState,
      action: DeleteMultipleStepsAction
    ) => omit(state, action.payload),
    TOGGLE_STEP_COLLAPSED: (
      state: CollapsedStepsState,
      { payload }: ToggleStepCollapsedAction
    ) => ({ ...state, [payload]: !state[payload] }),
    EXPAND_MULTIPLE_STEPS: (
      state: CollapsedStepsState,
      { payload }: ExpandMultipleStepsAction
    ) => payload.reduce((acc, stepId) => ({ ...acc, [stepId]: false }), state),
    COLLAPSE_MULTIPLE_STEPS: (
      state: CollapsedStepsState,
      { payload }: CollapseMultipleStepsAction
    ) => payload.reduce((acc, stepId) => ({ ...acc, [stepId]: true }), state),
    LOAD_FILE: (
      state: CollapsedStepsState,
      action: LoadFileAction // default all steps to collapsed
    ) =>
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
interface SingleSelectedItem {
  selectionType: typeof SINGLE_STEP_SELECTION_TYPE
  id: StepIdType
}
interface MultipleSelectedItem {
  selectionType: typeof MULTI_STEP_SELECTION_TYPE
  ids: StepIdType[]
  lastSelected: StepIdType
}
interface TerminalItem {
  selectionType: typeof TERMINAL_ITEM_SELECTION_TYPE
  id: TerminalItemId
}
export type SelectableItem =
  | SingleSelectedItem
  | MultipleSelectedItem
  | TerminalItem
type SelectedItemState = SelectableItem | null | undefined
export type HoverableItem = SingleSelectedItem | TerminalItem

function stepIdHelper(
  id: StepIdType | null | undefined
): SingleSelectedItem | null {
  if (id == null) return null
  return {
    selectionType: SINGLE_STEP_SELECTION_TYPE,
    id,
  }
}

function terminalItemIdHelper(
  id: TerminalItemId | null | undefined
): TerminalItem | null {
  if (id == null) return null
  return {
    selectionType: TERMINAL_ITEM_SELECTION_TYPE,
    id,
  }
}

export const initialSelectedItemState = {
  selectionType: TERMINAL_ITEM_SELECTION_TYPE,
  id: START_TERMINAL_ITEM_ID,
}
// @ts-expect-error(sa, 2021-6-10): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
const selectedItem: Reducer<SelectedItemState, any> = handleActions(
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
    CLEAR_SELECTED_ITEM: () => null,
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
// @ts-expect-error(sa, 2021-6-10): cannot use string literals as action type
// TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
const hoveredItem: Reducer<HoveredItemState, any> = handleActions(
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
    // @ts-expect-error(sa, 2021-6-10): cannot use string literals as action type
    // TODO IMMEDIATELY: refactor this to the old fashioned way if we cannot have type safety: https://github.com/redux-utilities/redux-actions/issues/282#issuecomment-595163081
    HOVER_ON_SUBSTEP: (
      state: SubstepIdentifier,
      action: HoverOnSubstepAction
    ) => action.payload,
  },
  null
)
const wellSelectionLabwareKey: Reducer<string | null, any> = handleActions(
  {
    SET_WELL_SELECTION_LABWARE_KEY: (
      state,
      action: {
        payload: string
      }
    ) => action.payload,
    CLEAR_WELL_SELECTION_LABWARE_KEY: () => null,
  },
  null
)
export interface StepsState {
  collapsedSteps: CollapsedStepsState
  selectedItem: SelectedItemState
  hoveredItem: HoveredItemState
  hoveredSubstep: SubstepIdentifier
  wellSelectionLabwareKey: string | null
}
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
