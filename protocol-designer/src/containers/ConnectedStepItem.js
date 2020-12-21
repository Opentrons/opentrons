// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import UAParser from 'ua-parser-js'
import { useConditionalConfirm } from '@opentrons/components'

import { selectors as uiLabwareSelectors } from '../ui/labware'
import * as timelineWarningSelectors from '../top-selectors/timelineWarnings'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import { selectors as dismissSelectors } from '../dismiss'
import { selectors as stepFormSelectors } from '../step-forms'
import {
  getCollapsedSteps,
  getHoveredSubstep,
  getHoveredStepId,
  getSelectedStepId,
  getMultiSelectItemIds,
  actions as stepsActions,
} from '../ui/steps'
import { selectors as fileDataSelectors } from '../file-data'
import { getBatchEditEnabled } from '../feature-flags/selectors'

import { StepItem, StepItemContents } from '../components/steplist/StepItem'
import {
  ConfirmDeleteModal,
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_UNSAVED_STEP_FORM,
} from '../components/modals/ConfirmDeleteModal'

import type { SubstepIdentifier } from '../steplist/types'
import type { StepIdType } from '../form-types'

type Props = {|
  stepId: StepIdType,
  stepNumber: number,
  onStepContextMenu?: () => mixed,
|}

const nonePressed = (keysPressed: Array<boolean>): boolean =>
  keysPressed.every(keyPress => keyPress === false)

const getUserOS = () => new UAParser().getOS().name

export const ConnectedStepItem = (props: Props): React.Node => {
  const { stepId, stepNumber } = props

  const step = useSelector(stepFormSelectors.getSavedStepForms)[stepId]
  const argsAndErrors = useSelector(stepFormSelectors.getArgsAndErrorsByStepId)[
    stepId
  ]
  const errorStepId = useSelector(fileDataSelectors.getErrorStepId)
  const hasError = errorStepId === stepId || argsAndErrors.errors !== undefined
  const hasTimelineWarningsPerStep = useSelector(
    timelineWarningSelectors.getHasTimelineWarningsPerStep
  )
  const hasFormLevelWarningsPerStep = useSelector(
    dismissSelectors.getHasFormLevelWarningsPerStep
  )

  const hasWarnings =
    hasTimelineWarningsPerStep[stepId] || hasFormLevelWarningsPerStep[stepId]

  const collapsed = useSelector(getCollapsedSteps)[stepId]
  const hoveredSubstep = useSelector(getHoveredSubstep)
  const hoveredStep = useSelector(getHoveredStepId)
  const selectedStepId = useSelector(getSelectedStepId)
  const orderedStepIds = useSelector(stepFormSelectors.getOrderedStepIds)
  const multiSelectItemIds = useSelector(getMultiSelectItemIds)
  const selected: boolean = multiSelectItemIds?.length
    ? multiSelectItemIds.includes(stepId)
    : selectedStepId === stepId

  const substeps = useSelector(fileDataSelectors.getSubsteps)[stepId]

  const ingredNames = useSelector(labwareIngredSelectors.getLiquidNamesById)
  const labwareNicknamesById = useSelector(
    uiLabwareSelectors.getLabwareNicknamesById
  )
  const currentFormIsPresaved = useSelector(
    stepFormSelectors.getCurrentFormIsPresaved
  )
  const formHasChanges = useSelector(
    stepFormSelectors.getCurrentFormHasUnsavedChanges
  )

  const isBatchEditEnabled = useSelector(getBatchEditEnabled)

  // Actions
  const dispatch = useDispatch()

  const highlightSubstep = (payload: SubstepIdentifier) =>
    dispatch(stepsActions.hoverOnSubstep(payload))
  const selectStep = () => dispatch(stepsActions.selectStep(stepId))
  const selectMultipleSteps = (
    steps: Array<StepIdType>,
    lastSelected: StepIdType
  ) => dispatch(stepsActions.selectMultipleSteps(steps, lastSelected))
  const toggleStepCollapsed = () =>
    dispatch(stepsActions.toggleStepCollapsed(stepId))
  const highlightStep = () => dispatch(stepsActions.hoverOnStep(stepId))
  const unhighlightStep = () => dispatch(stepsActions.hoverOnStep(null))

  const handleStepItemSelection = (e: SyntheticMouseEvent<>): void => {
    const isMac: boolean = getUserOS() === 'Mac OS'
    const isShiftKeyPressed: boolean = e.shiftKey
    const isMetaKeyPressed: boolean =
      (isMac && e.metaKey) || (!isMac && e.ctrlKey)

    let stepsToSelect: Array<StepIdType> = []

    if (nonePressed([isShiftKeyPressed, isMetaKeyPressed])) {
      if (multiSelectItemIds?.length) {
        stepsToSelect = multiSelectItemIds.includes(stepId)
          ? multiSelectItemIds.filter(id => id !== stepId)
          : [...multiSelectItemIds, stepId]
        stepsToSelect.length && selectMultipleSteps(stepsToSelect, stepId)
      } else {
        selectStep()
      }
      return
    }

    if (isBatchEditEnabled) {
      if ((isMetaKeyPressed || isShiftKeyPressed) && currentFormIsPresaved) {
        // current form is presaved, enter batch edit mode with only the selected step
        stepsToSelect = [stepId]
      } else {
        if (isShiftKeyPressed) {
          if (selectedStepId) {
            const startIndex: number = orderedStepIds.indexOf(selectedStepId)
            const endIndex: number = orderedStepIds.indexOf(stepId)
            stepsToSelect = orderedStepIds.slice(startIndex, endIndex + 1)
          } else {
            stepsToSelect = [stepId]
          }
        } else if (isMetaKeyPressed) {
          if (multiSelectItemIds?.length) {
            stepsToSelect = multiSelectItemIds.includes(stepId)
              ? multiSelectItemIds.filter(id => id !== stepId)
              : [...multiSelectItemIds, stepId]
          } else if (selectedStepId) {
            stepsToSelect = [selectedStepId, stepId]
          } else {
            stepsToSelect = [stepId]
          }
        }
      }
      if (stepsToSelect.length) {
        selectMultipleSteps(stepsToSelect, stepId)
      }
    }
  }

  // step selection is gated when showConfirmation is true
  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    handleStepItemSelection,
    currentFormIsPresaved || formHasChanges
  )

  const stepItemProps = {
    description: step.stepDetails,
    rawForm: step,
    stepNumber,
    stepType: step.stepType,
    title: step.stepName,

    collapsed,
    error: hasError,
    warning: hasWarnings,
    selected,
    // no double-highlighting: whole step is only "hovered" when
    // user is not hovering on substep.
    hovered: hoveredStep === stepId && !hoveredSubstep,

    highlightStep,
    handleClick: confirm,
    toggleStepCollapsed,
    unhighlightStep,
  }

  const stepItemContentsProps = {
    rawForm: step,
    stepType: step.stepType,
    substeps,

    ingredNames,
    labwareNicknamesById,

    highlightSubstep,
    hoveredSubstep,
  }

  return (
    <>
      {showConfirmation && (
        <ConfirmDeleteModal
          modalType={
            currentFormIsPresaved
              ? CLOSE_UNSAVED_STEP_FORM
              : CLOSE_STEP_FORM_WITH_CHANGES
          }
          onContinueClick={confirm}
          onCancelClick={cancel}
        />
      )}
      <StepItem {...stepItemProps} onStepContextMenu={props.onStepContextMenu}>
        <StepItemContents {...stepItemContentsProps} />
      </StepItem>
    </>
  )
}
