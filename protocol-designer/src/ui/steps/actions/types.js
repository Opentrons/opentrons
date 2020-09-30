// @flow
import type { StepIdType, StepType } from '../../../form-types'
import type { TerminalItemId, SubstepIdentifier } from '../../../steplist/types'
import type { Timeline } from '../../../step-generation'

type AddStepPayload = {| id: string, stepType: StepType |}
export type AddStepAction = {|
  type: 'ADD_STEP',
  payload: AddStepPayload,
  meta: { robotStateTimeline: Timeline },
|}

export type ClearWellSelectionLabwareKeyAction = {|
  type: 'CLEAR_WELL_SELECTION_LABWARE_KEY',
  payload: null,
|}

export type DuplicateStepAction = {|
  type: 'DUPLICATE_STEP',
  payload: {
    stepId: StepIdType,
    duplicateStepId: StepIdType,
  },
|}

export type ExpandAddStepButtonAction = {|
  type: 'EXPAND_ADD_STEP_BUTTON',
  payload: boolean,
|}

export type ToggleStepCollapsedAction = {|
  type: 'TOGGLE_STEP_COLLAPSED',
  payload: StepIdType,
|}

export type HoverOnSubstepAction = {|
  type: 'HOVER_ON_SUBSTEP',
  payload: SubstepIdentifier,
|}

export type ReorderSelectedStepAction = {|
  type: 'REORDER_SELECTED_STEP',
  payload: {|
    delta: number,
    stepId: StepIdType,
  |},
|}

export type SelectTerminalItemAction = {|
  type: 'SELECT_TERMINAL_ITEM',
  payload: TerminalItemId,
|}

// TODO: Ian 2018-07-31 types aren't being inferred by ActionType in hoveredItem reducer...
export type HoverOnStepAction = {|
  type: 'HOVER_ON_STEP',
  payload: ?StepIdType,
|}

export type HoverOnTerminalItemAction = {|
  type: 'HOVER_ON_TERMINAL_ITEM',
  payload: ?TerminalItemId,
|}
export type SetWellSelectionLabwareKeyAction = {|
  type: 'SET_WELL_SELECTION_LABWARE_KEY',
  payload: ?string,
|}

export type SelectStepAction = {| type: 'SELECT_STEP', payload: StepIdType |}
