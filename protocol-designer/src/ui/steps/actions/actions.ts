import last from 'lodash/last'
import {
  analyticsEvent,
  AnalyticsEventAction,
} from '../../../analytics/actions'
import {
  PRESAVED_STEP_ID,
  TerminalItemId,
  SubstepIdentifier,
} from '../../../steplist/types'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { getMultiSelectLastSelected } from '../selectors'
import { resetScrollElements } from '../utils'
import { Timeline } from '@opentrons/step-generation'
import { StepIdType, StepType } from '../../../form-types'
import { GetState, ThunkAction, ThunkDispatch } from '../../../types'
import { AnalyticsEvent } from '../../../analytics/mixpanel'
import {
  AddStepAction,
  ExpandAddStepButtonAction,
  ToggleStepCollapsedAction,
  ExpandMultipleStepsAction,
  CollapseMultipleStepsAction,
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
  stepType: StepType
  robotStateTimeline: Timeline
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
export const expandMultipleSteps = (
  stepIds: StepIdType[]
): ExpandMultipleStepsAction => ({
  type: 'EXPAND_MULTIPLE_STEPS',
  payload: stepIds,
})
export const collapseMultipleSteps = (
  stepIds: StepIdType[]
): CollapseMultipleStepsAction => ({
  type: 'COLLAPSE_MULTIPLE_STEPS',
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
export const hoverOnStep = (
  stepId: StepIdType | null | undefined
): HoverOnStepAction => ({
  type: 'HOVER_ON_STEP',
  payload: stepId,
})
export const hoverOnTerminalItem = (
  terminalId: TerminalItemId | null | undefined
): HoverOnTerminalItemAction => ({
  type: 'HOVER_ON_TERMINAL_ITEM',
  payload: terminalId,
})
export const setWellSelectionLabwareKey = (
  labwareName: string | null | undefined
): SetWellSelectionLabwareKeyAction => ({
  type: 'SET_WELL_SELECTION_LABWARE_KEY',
  payload: labwareName,
})
export const clearWellSelectionLabwareKey = (): ClearWellSelectionLabwareKeyAction => ({
  type: 'CLEAR_WELL_SELECTION_LABWARE_KEY',
  payload: null,
})
export const selectStep = (stepId: StepIdType): ThunkAction<any> => (
  dispatch: ThunkDispatch<any>,
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
  stepIds: StepIdType[],
  lastSelected: StepIdType
): ThunkAction<SelectMultipleStepsAction> => (
  dispatch: ThunkDispatch<any>,
  getState: GetState
) => {
  const selectStepAction: SelectMultipleStepsAction = {
    type: 'SELECT_MULTIPLE_STEPS',
    payload: {
      stepIds,
      lastSelected,
    },
  }
  dispatch(selectStepAction)
}
export const selectAllSteps = (): ThunkAction<
  SelectMultipleStepsAction | AnalyticsEventAction
> => (
  dispatch: ThunkDispatch<SelectMultipleStepsAction | AnalyticsEventAction>,
  getState: GetState
) => {
  const allStepIds = stepFormSelectors.getOrderedStepIds(getState())
  const selectStepAction: SelectMultipleStepsAction = {
    type: 'SELECT_MULTIPLE_STEPS',
    payload: {
      stepIds: allStepIds,
      // @ts-expect-error(sa, 2021-6-15): find could return undefined, need to null check PipetteNameSpecs
      lastSelected: last(allStepIds),
    },
  }
  dispatch(selectStepAction)
  // dispatch an analytics event to indicate all steps have been selected
  // because there is no 'SELECT_ALL_STEPS' action that middleware can catch
  const selectAllStepsEvent: AnalyticsEvent = {
    name: 'selectAllSteps',
    properties: {},
  }
  dispatch(analyticsEvent(selectAllStepsEvent))
}
export const EXIT_BATCH_EDIT_MODE_BUTTON_PRESS: 'EXIT_BATCH_EDIT_MODE_BUTTON_PRESS' =
  'EXIT_BATCH_EDIT_MODE_BUTTON_PRESS'
export const deselectAllSteps = (
  meta?: typeof EXIT_BATCH_EDIT_MODE_BUTTON_PRESS
): ThunkAction<SelectStepAction | AnalyticsEventAction> => (
  dispatch: ThunkDispatch<SelectStepAction | AnalyticsEventAction>,
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

  // dispatch an analytics event to indicate all steps have been deselected
  // because there is no 'DESELECT_ALL_STEPS'/'EXIT_BATCH_EDIT_MODE' action that middleware can catch
  if (meta === EXIT_BATCH_EDIT_MODE_BUTTON_PRESS) {
    // for analytics purposes we want to differentiate between
    // deselecting all, and using the "exit batch edit mode" button
    const exitBatchEditModeEvent: AnalyticsEvent = {
      name: 'exitBatchEditMode',
      properties: {},
    }
    dispatch(analyticsEvent(exitBatchEditModeEvent))
  } else {
    const deselectAllStepsEvent: AnalyticsEvent = {
      name: 'deselectAllSteps',
      properties: {},
    }
    dispatch(analyticsEvent(deselectAllStepsEvent))
  }
}
