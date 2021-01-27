// @flow
import last from 'lodash/last'
import { PRESAVED_STEP_ID } from '../../../steplist/types'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { getMultiSelectLastSelected } from '..'
import { resetScrollElements } from '../utils'
import type { StepIdType, StepType } from '../../../form-types'
import type { GetState, ThunkAction, ThunkDispatch } from '../../../types'
import type { Timeline } from '../../../step-generation'
import type { TerminalItemId, SubstepIdentifier } from '../../../steplist/types'
import type {
  AddStepAction,
  ExpandAddStepButtonAction,
  ToggleStepCollapsedAction,
  ToggleMultipleStepsCollapsedAction,
  HoverOnStepAction,
  HoverOnSubstepAction,
  SelectTerminalItemAction,
  HoverOnTerminalItemAction,
  SetWellSelectionLabwareKeyAction,
  ClearWellSelectionLabwareKeyAction,
  SelectStepAction,
  SelectMultipleStepsAction,
} from './types'

// adds an incremental integer ID for Step reducers.
// NOTE: if this is an "add step" directly performed by the user,
// addAndSelectStepWithHints is probably what you want
export const addStep = (args: {
  stepType: StepType,
  robotStateTimeline: Timeline,
}): AddStepAction => {
  return {
    type: 'ADD_STEP',
    payload: {
      stepType: args.stepType,
      id: PRESAVED_STEP_ID,
    },
    meta: {
      robotStateTimeline: args.robotStateTimeline,
    },
  }
}

export const expandAddStepButton = (
  payload: boolean
): ExpandAddStepButtonAction => ({
  type: 'EXPAND_ADD_STEP_BUTTON',
  payload,
})

export const toggleStepCollapsed = (
  stepId: StepIdType
): ToggleStepCollapsedAction => ({
  type: 'TOGGLE_STEP_COLLAPSED',
  payload: stepId,
})

export const toggleMultipleStepsCollapsed = (
  stepIds: Array<StepIdType>
): ToggleMultipleStepsCollapsedAction => ({
  type: 'TOGGLE_MULTIPLE_STEPS_COLLAPSED',
  payload: stepIds,
})

export const hoverOnSubstep = (
  payload: SubstepIdentifier
): HoverOnSubstepAction => ({
  type: 'HOVER_ON_SUBSTEP',
  payload: payload,
})

export const selectTerminalItem = (
  terminalId: TerminalItemId
): SelectTerminalItemAction => ({
  type: 'SELECT_TERMINAL_ITEM',
  payload: terminalId,
})

export const hoverOnStep = (stepId: ?StepIdType): HoverOnStepAction => ({
  type: 'HOVER_ON_STEP',
  payload: stepId,
})

export const hoverOnTerminalItem = (
  terminalId: ?TerminalItemId
): HoverOnTerminalItemAction => ({
  type: 'HOVER_ON_TERMINAL_ITEM',
  payload: terminalId,
})

export const setWellSelectionLabwareKey = (
  labwareName: ?string
): SetWellSelectionLabwareKeyAction => ({
  type: 'SET_WELL_SELECTION_LABWARE_KEY',
  payload: labwareName,
})

export const clearWellSelectionLabwareKey = (): ClearWellSelectionLabwareKeyAction => ({
  type: 'CLEAR_WELL_SELECTION_LABWARE_KEY',
  payload: null,
})

export const selectStep = (stepId: StepIdType): ThunkAction<*> => (
  dispatch: ThunkDispatch<*>,
  getState: GetState
) => {
  const selectStepAction: SelectStepAction = {
    type: 'SELECT_STEP',
    payload: stepId,
  }
  dispatch(selectStepAction)

  const state = getState()
  const formData = { ...stepFormSelectors.getSavedStepForms(state)[stepId] }

  dispatch({
    type: 'POPULATE_FORM',
    payload: formData,
  })

  resetScrollElements()
}

// NOTE(sa, 2020-12-11): this is a thunk so that we can populate the batch edit form with things later
export const selectMultipleSteps = (
  stepIds: Array<StepIdType>,
  lastSelected: StepIdType
): ThunkAction<*> => (dispatch: ThunkDispatch<*>, getState: GetState) => {
  const selectStepAction: SelectMultipleStepsAction = {
    type: 'SELECT_MULTIPLE_STEPS',
    payload: { stepIds, lastSelected },
  }
  dispatch(selectStepAction)
}

export const selectAllSteps = (): ThunkAction<*> => (
  dispatch: ThunkDispatch<*>,
  getState: GetState
) => {
  const allStepIds = stepFormSelectors.getOrderedStepIds(getState())

  const selectStepAction: SelectMultipleStepsAction = {
    type: 'SELECT_MULTIPLE_STEPS',
    payload: { stepIds: allStepIds, lastSelected: last(allStepIds) },
  }
  dispatch(selectStepAction)
}

export const deselectAllSteps = (): ThunkAction<*> => (
  dispatch: ThunkDispatch<*>,
  getState: GetState
) => {
  const lastSelectedStepId = getMultiSelectLastSelected(getState())
  if (lastSelectedStepId) {
    const selectStepAction: SelectStepAction = {
      type: 'SELECT_STEP',
      payload: lastSelectedStepId,
    }
    dispatch(selectStepAction)
  } else {
    console.warn(
      'something went wrong, cannot deselect all steps if not in multi select mode'
    )
  }
}
