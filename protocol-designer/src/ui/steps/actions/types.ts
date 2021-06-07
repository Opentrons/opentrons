import type { Timeline } from '@opentrons/step-generation'
import type { StepIdType, StepType } from '../../../form-types'
import type { TerminalItemId, SubstepIdentifier } from '../../../steplist/types'
type AddStepPayload = {
  id: string
  stepType: StepType
}
export type AddStepAction = {
  type: 'ADD_STEP'
  payload: AddStepPayload
  meta: {
    robotStateTimeline: Timeline
  }
}
export type ClearWellSelectionLabwareKeyAction = {
  type: 'CLEAR_WELL_SELECTION_LABWARE_KEY'
  payload: null
}
type DuplicateStepPayload = {
  stepId: StepIdType
  duplicateStepId: StepIdType
}
export type DuplicateStepAction = {
  type: 'DUPLICATE_STEP'
  payload: DuplicateStepPayload
}
export type DuplicateMultipleStepsAction = {
  type: 'DUPLICATE_MULTIPLE_STEPS'
  payload: {
    steps: Array<DuplicateStepPayload>
    indexToInsert: number
  }
}
export type ExpandAddStepButtonAction = {
  type: 'EXPAND_ADD_STEP_BUTTON'
  payload: boolean
}
export type ToggleStepCollapsedAction = {
  type: 'TOGGLE_STEP_COLLAPSED'
  payload: StepIdType
}
export type ExpandMultipleStepsAction = {
  type: 'EXPAND_MULTIPLE_STEPS'
  payload: Array<StepIdType>
}
export type CollapseMultipleStepsAction = {
  type: 'COLLAPSE_MULTIPLE_STEPS'
  payload: Array<StepIdType>
}
export type HoverOnSubstepAction = {
  type: 'HOVER_ON_SUBSTEP'
  payload: SubstepIdentifier
}
export type ReorderSelectedStepAction = {
  type: 'REORDER_SELECTED_STEP'
  payload: {
    delta: number
    stepId: StepIdType
  }
}
export type ClearSelectedItemAction = {
  type: 'CLEAR_SELECTED_ITEM'
}
export type SelectTerminalItemAction = {
  type: 'SELECT_TERMINAL_ITEM'
  payload: TerminalItemId
}
// TODO: Ian 2018-07-31 types aren't being inferred by ActionType in hoveredItem reducer...
export type HoverOnStepAction = {
  type: 'HOVER_ON_STEP'
  payload: StepIdType | null | undefined
}
export type HoverOnTerminalItemAction = {
  type: 'HOVER_ON_TERMINAL_ITEM'
  payload: TerminalItemId | null | undefined
}
export type SetWellSelectionLabwareKeyAction = {
  type: 'SET_WELL_SELECTION_LABWARE_KEY'
  payload: string | null | undefined
}
export type SelectStepAction = {
  type: 'SELECT_STEP'
  payload: StepIdType
}
export type SelectMultipleStepsAction = {
  type: 'SELECT_MULTIPLE_STEPS'
  payload: {
    stepIds: Array<StepIdType>
    lastSelected: StepIdType
  }
}
