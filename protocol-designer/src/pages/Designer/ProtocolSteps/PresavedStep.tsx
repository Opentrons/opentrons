import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { PRESAVED_STEP_ID } from '../../../steplist/types'
import { selectors as stepFormSelectors } from '../../../step-forms'
import {
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
  actions as stepsActions,
} from '../../../ui/steps'
import { StepContainer } from './StepContainer'

export const PresavedStep = (): JSX.Element | null => {
  const { t } = useTranslation('application')
  const presavedStepForm = useSelector(stepFormSelectors.getPresavedStepForm)
  const stepNumber = useSelector(stepFormSelectors.getOrderedStepIds).length + 1
  const hovered = useSelector(getHoveredTerminalItemId) === PRESAVED_STEP_ID
  const selected = useSelector(getSelectedTerminalItemId) === PRESAVED_STEP_ID

  // Actions
  const dispatch = useDispatch()
  const toggleStepCollapsed = (): void => {
    dispatch(stepsActions.toggleStepCollapsed(PRESAVED_STEP_ID))
  }
  const highlightStep = (): void => {
    dispatch(stepsActions.hoverOnTerminalItem(PRESAVED_STEP_ID))
  }
  const unhighlightStep = (): void => {
    dispatch(stepsActions.hoverOnTerminalItem(null))
  }

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
  return (
    <StepContainer
      {...stepItemProps}
      title={`${stepNumber}. ${t(`stepType.${stepItemProps.stepType}`)}`}
    />
  )
}
