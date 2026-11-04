import { combineReducers } from 'redux'
import { handleActions } from 'redux-actions'

import { PRESAVED_STEP_ID, START_TERMINAL_ITEM_ID } from '../../steplist/types'

import type { Reducer } from 'redux'
import type { StepIdType } from '../../form-types'
import type { SubstepIdentifier, TerminalItemId } from '../../steplist/types'
import type { SaveStepFormAction } from '../steps/actions/thunks'
import type {
  AddStepAction,
  HoverOnStepAction,
  HoverOnSubstepAction,
  HoverOnTerminalItemAction,
  Selection,
  SelectMultipleStepsAction,
  SelectStepAction,
  SelectTerminalItemAction,
} from './actions/types'

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
  SingleSelectedItem | MultipleSelectedItem | TerminalItem
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
      return stepIdHelper(action.payload.form.id)
    },
    SELECT_STEP: (state: SelectedItemState, action: SelectStepAction) =>
      stepIdHelper(action.payload),
    SELECT_TERMINAL_ITEM: (
      state: SelectedItemState,
      action: SelectTerminalItemAction
    ) => terminalItemIdHelper(action.payload),
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

const hoveredSubstep: Reducer<SubstepIdentifier, HoverOnSubstepAction> =
  handleActions(
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

const selectedSubstep: Reducer<StepIdType | null, any> = handleActions(
  {
    TOGGLE_VIEW_SUBSTEP: (
      state,
      action: {
        payload: StepIdType
      }
    ) => action.payload,
  },
  null
)

const hoveredDropdownItem: Reducer<Selection, any> = handleActions(
  {
    HOVER_DROPDOWN_ITEM: (
      state,
      action: {
        payload: Selection
      }
    ) => action.payload,
  },
  { id: null, text: null }
)

const selectedDropdownItem: Reducer<Selection[], any> = handleActions(
  {
    SELECT_DROPDOWN_ITEM: (
      state: Selection[],
      action: {
        payload: {
          selection: Selection | null
          mode: 'add' | 'clear'
        }
      }
    ) => {
      const { selection, mode } = action.payload

      switch (mode) {
        case 'clear':
          return []
        case 'add': {
          if (!selection) {
            return state
          }
          const updatedState = state.filter(
            sel => sel.field !== selection.field
          )

          return [...updatedState, selection]
        }
        default:
          return state
      }
    },
  },
  []
)

export interface StepsState {
  selectedItem: SelectedItemState
  hoveredItem: HoveredItemState
  hoveredSubstep: SubstepIdentifier
  wellSelectionLabwareKey: string | null
  selectedSubstep: StepIdType | null
  hoveredDropdownItem: Selection
  selectedDropdownItem: Selection[]
}
export const _allReducers = {
  selectedItem,
  hoveredItem,
  hoveredSubstep,
  wellSelectionLabwareKey,
  selectedSubstep,
  hoveredDropdownItem,
  selectedDropdownItem,
}
export const rootReducer = combineReducers(_allReducers)
