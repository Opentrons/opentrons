// @flow
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StepItem } from './StepItem'
import { PRESAVED_STEP_ID } from '../../steplist/types'
// import * as substepSelectors from '../../top-selectors/substeps'
// import * as timelineWarningSelectors from '../../top-selectors/timelineWarnings'
// import { selectors as dismissSelectors } from '../../dismiss'
// import {
//   selectors as stepFormSelectors,
//   type LabwareEntity,
// } from '../../step-forms'
import {
  getHoveredTerminalItemId,
  getSelectedTerminalItemId,
  actions as stepsActions,
} from '../../ui/steps'
// import { selectors as fileDataSelectors } from '../../file-data'
// import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
// import { selectors as uiLabwareSelectors } from '../../ui/labware'

export const PresavedStepItem = () => {
  const itemId = PRESAVED_STEP_ID // TODO make this a prop, rename this component PresavedStepTerminalItem
  const hovered = useSelector(getHoveredTerminalItemId) === itemId
  const selected = useSelector(getSelectedTerminalItemId) === itemId

  // TODO placeholders, need a presaved step reducer
  const stepNumber = 123
  const stepType = 'transfer'
  const title = 'title todo'

  // Actions
  const dispatch = useDispatch()
  const selectStep = () => dispatch(stepsActions.selectTerminalItem(itemId))
  const toggleStepCollapsed = () =>
    dispatch(stepsActions.toggleStepCollapsed(itemId))
  const highlightStep = () => dispatch(stepsActions.hoverOnTerminalItem(itemId))
  const unhighlightStep = () => dispatch(stepsActions.hoverOnTerminalItem(null))

  // TODO IMMEDIATELY: return null if there's no presaved step

  const stepItemProps = {
    isPresavedStep: true,
    stepId: PRESAVED_STEP_ID, // TODO immediately don't pass in
    stepNumber,
    stepType,
    title,
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
