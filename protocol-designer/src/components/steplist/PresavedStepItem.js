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
  const hovered = useSelector(getHoveredTerminalItemId) === itemId
  const selected = useSelector(getSelectedTerminalItemId) === itemId

  // Actions
  const dispatch = useDispatch()
  const selectStep = () => dispatch(stepsActions.selectTerminalItem(itemId))
  const toggleStepCollapsed = () =>
    dispatch(stepsActions.toggleStepCollapsed(itemId))
  const highlightStep = () => dispatch(stepsActions.hoverOnTerminalItem(itemId))
  const unhighlightStep = () => dispatch(stepsActions.hoverOnTerminalItem(null))

  if (presavedStepForm === null) {
    return null
  }

  // TODO placeholders, need a presaved step reducer
  const { stepType } = presavedStepForm
  const stepNumber = 123

  const stepItemProps = {
    isPresavedStep: true,
    stepId: PRESAVED_STEP_ID, // TODO immediately don't pass in
    stepNumber,
    stepType,
    description: null,
    substeps: null,
    rawForm: null, // TODO IMMEDIATELY initial values? Actually I don't think it needs it

    //   collapsed?: boolean,
    //   error?: ?boolean,
    //   warning?: ?boolean,
    selected,
    hovered,
    ingredNames: {}, // TODO IMMEDIATELY make optional prop?
    labwareNicknamesById: {}, // TODO IMMEDIATELY make optional prop?
    labwareDefDisplayNamesById: {}, // TODO IMMEDIATELY make optional prop?
    // highlightSubstep, // TODO IMMEDIATELY make optional
    selectStep,
    //   onStepContextMenu?: (event?: SyntheticEvent<>) => mixed,
    toggleStepCollapsed,
    highlightStep,
    unhighlightStep,
  }
  return <StepItem {...stepItemProps} />
}
