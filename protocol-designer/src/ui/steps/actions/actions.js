// @flow
import forEach from 'lodash/forEach'

import type { StepIdType, StepType } from '../../../form-types'
import { selectors as stepFormSelectors } from '../../../step-forms'
import type { SubstepIdentifier, TerminalItemId } from '../../../steplist/types'
import type { GetState, ThunkAction, ThunkDispatch } from '../../../types'
import { uuid } from '../../../utils'
import { MAIN_CONTENT_FORCED_SCROLL_CLASSNAME } from '../constants'
import type {
  AddStepAction,
  ClearWellSelectionLabwareKeyAction,
  ExpandAddStepButtonAction,
  HoverOnStepAction,
  HoverOnSubstepAction,
  HoverOnTerminalItemAction,
  SelectStepAction,
  SelectTerminalItemAction,
  SetWellSelectionLabwareKeyAction,
  ToggleStepCollapsedAction,
} from './types'

// adds an incremental integer ID for Step reducers.
// NOTE: if this is an "add step" directly performed by the user,
// addAndSelectStepWithHints is probably what you want
export const addStep = (payload: { stepType: StepType }): AddStepAction => {
  const stepId = uuid()
  return {
    type: 'ADD_STEP',
    payload: {
      stepType: payload.stepType,
      id: stepId,
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

  // scroll to top of all elements with the special class
  forEach(
    global.document.getElementsByClassName(
      MAIN_CONTENT_FORCED_SCROLL_CLASSNAME
    ),
    elem => {
      elem.scrollTop = 0
    }
  )
}
