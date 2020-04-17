// @flow
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StepItem } from './StepItem'
import { PRESAVED_STEP_ID } from '../../steplist/types'
import { selectors as stepFormSelectors } from '../../step-forms'
import {
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
  actions as stepsActions,
} from '../../ui/steps'

const itemId = PRESAVED_STEP_ID // TODO make this a prop, rename this component PresavedStepTerminalItem ???

export const PresavedStepItem = () => {
  const presavedStepForm = useSelector(stepFormSelectors.getPresavedStepForm)
  const stepNumber = useSelector(stepFormSelectors.getOrderedStepIds).length + 1
  const hovered = useSelector(getHoveredTerminalItemId) === itemId
  const selected = useSelector(getSelectedTerminalItemId) === itemId

  // Actions
  const dispatch = useDispatch()
  const toggleStepCollapsed = () =>
    dispatch(stepsActions.toggleStepCollapsed(itemId))
  const highlightStep = () => dispatch(stepsActions.hoverOnTerminalItem(itemId))
  const unhighlightStep = () => dispatch(stepsActions.hoverOnTerminalItem(null))

  if (presavedStepForm === null) {
    return null
  }

  const stepItemProps = {
    rawForm: null,
    stepNumber,
    stepType: presavedStepForm.stepType,

    selected,
    hovered,

    toggleStepCollapsed,
    highlightStep,
    unhighlightStep,
  }
  return <StepItem {...stepItemProps} />
}
