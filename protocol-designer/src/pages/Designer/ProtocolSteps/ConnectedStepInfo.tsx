import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import uniq from 'lodash/uniq'
import UAParser from 'ua-parser-js'
import { useConditionalConfirm } from '@opentrons/components'

import * as timelineWarningSelectors from '../../../top-selectors/timelineWarnings'
import { selectors as dismissSelectors } from '../../../dismiss'
import { selectors as stepFormSelectors } from '../../../step-forms'
import {
  actions as stepsActions,
  getHoveredStepId,
  getHoveredSubstep,
  getIsMultiSelectMode,
  getMultiSelectItemIds,
  getMultiSelectLastSelected,
  getSelectedStepId,
} from '../../../ui/steps'
import { selectors as fileDataSelectors } from '../../../file-data'

import {
  CLOSE_BATCH_EDIT_FORM,
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_UNSAVED_STEP_FORM,
  ConfirmDeleteModal,
} from '../../../components/modals/ConfirmDeleteModal'


import type { ThunkDispatch } from 'redux-thunk'
import type {
  HoverOnStepAction,

  SelectMultipleStepsAction,
} from '../../../ui/steps'

import type { DeleteModalType } from '../../../components/modals/ConfirmDeleteModal'
import { stepIconsByType, type StepIdType } from '../../../form-types'
import type { BaseState, ThunkAction } from '../../../types'
import { StepContainer } from './StepContainer'
import { useTranslation } from 'react-i18next'

export interface ConnectedStepItemProps {
  stepId: StepIdType
  stepNumber: number
  onStepContextMenu?: () => void
}

const nonePressed = (keysPressed: boolean[]): boolean =>
  keysPressed.every(keyPress => keyPress === false)

const getUserOS = (): string | undefined => new UAParser().getOS().name

const getMouseClickKeyInfo = (
  event: React.MouseEvent
): { isShiftKeyPressed: boolean; isMetaKeyPressed: boolean } => {
  const isMac: boolean = getUserOS() === 'Mac OS'
  const isShiftKeyPressed: boolean = event.shiftKey
  const isMetaKeyPressed: boolean =
    (isMac && event.metaKey) || (!isMac && event.ctrlKey)
  return { isShiftKeyPressed, isMetaKeyPressed }
}

export const ConnectedStepInfo = (
  props: ConnectedStepItemProps
): JSX.Element => {
  const { stepId, stepNumber } = props
  const { t } = useTranslation('application')

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
  const hoveredSubstep = useSelector(getHoveredSubstep)
  const hoveredStep = useSelector(getHoveredStepId)
  const selectedStepId = useSelector(getSelectedStepId)
  const orderedStepIds = useSelector(stepFormSelectors.getOrderedStepIds)
  const multiSelectItemIds = useSelector(getMultiSelectItemIds)
  const lastMultiSelectedStepId = useSelector(getMultiSelectLastSelected)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const selected: boolean = multiSelectItemIds?.length
    ? multiSelectItemIds.includes(stepId)
    : selectedStepId === stepId

  const currentFormIsPresaved = useSelector(
    stepFormSelectors.getCurrentFormIsPresaved
  )
  const singleEditFormHasUnsavedChanges = useSelector(
    stepFormSelectors.getCurrentFormHasUnsavedChanges
  )
  const batchEditFormHasUnsavedChanges = useSelector(
    stepFormSelectors.getBatchEditFormHasUnsavedChanges
  )

  // Actions
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()

  const selectStep = (): ThunkAction<any> =>
    dispatch(stepsActions.selectStep(stepId))
  const selectMultipleSteps = (
    steps: StepIdType[],
    lastSelected: StepIdType
  ): ThunkAction<SelectMultipleStepsAction> =>
    dispatch(stepsActions.selectMultipleSteps(steps, lastSelected))
  const highlightStep = (): HoverOnStepAction =>
    dispatch(stepsActions.hoverOnStep(stepId))
  const unhighlightStep = (): HoverOnStepAction =>
    dispatch(stepsActions.hoverOnStep(null))

  const handleStepItemSelection = (event: React.MouseEvent): void => {
    const { isShiftKeyPressed, isMetaKeyPressed } = getMouseClickKeyInfo(event)
    let stepsToSelect: StepIdType[] = []

    // if user clicked on the last multi-selected step, shift/meta keys don't matter
    const toggledLastSelected = stepId === lastMultiSelectedStepId
    const noModifierKeys =
      nonePressed([isShiftKeyPressed, isMetaKeyPressed]) || toggledLastSelected

    if (noModifierKeys) {
      if (multiSelectItemIds) {
        const alreadySelected = multiSelectItemIds.includes(stepId)
        if (alreadySelected) {
          stepsToSelect = multiSelectItemIds.filter(id => id !== stepId)
        } else {
          stepsToSelect = [...multiSelectItemIds, stepId]
        }
      } else {
        selectStep()
      }
    } else if (
      (isMetaKeyPressed || isShiftKeyPressed) &&
      currentFormIsPresaved
    ) {
      // current form is presaved, enter batch edit mode with only the clicked
      stepsToSelect = [stepId]
    } else {
      if (isShiftKeyPressed) {
        stepsToSelect = getShiftSelectedSteps(
          selectedStepId,
          orderedStepIds,
          stepId,
          multiSelectItemIds,
          lastMultiSelectedStepId
        )
      } else if (isMetaKeyPressed) {
        stepsToSelect = getMetaSelectedSteps(
          multiSelectItemIds,
          stepId,
          selectedStepId
        )
      }
    }
    if (stepsToSelect.length) {
      selectMultipleSteps(stepsToSelect, stepId)
    }
  }

  // step selection is gated when showConfirmation is true
  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    handleStepItemSelection,
    isMultiSelectMode
      ? batchEditFormHasUnsavedChanges
      : currentFormIsPresaved || singleEditFormHasUnsavedChanges
  )

  const getModalType = (): DeleteModalType => {
    if (isMultiSelectMode) {
      return CLOSE_BATCH_EDIT_FORM
    } else if (currentFormIsPresaved) {
      return CLOSE_UNSAVED_STEP_FORM
    } else {
      return CLOSE_STEP_FORM_WITH_CHANGES
    }
  }
  const iconName = stepIconsByType[step.stepType]
  return (
    <>
      {showConfirmation && (
        <ConfirmDeleteModal
          modalType={getModalType()}
          onContinueClick={confirm}
          onCancelClick={cancel}
        />
      )}
      <StepContainer
        id={`${stepNumber}`}
        onMouseLeave={unhighlightStep}
        selected={selected}
        onClick={confirm}
        iconColor={hasError ? 'red' : undefined}
        hovered={hoveredStep === stepId && !hoveredSubstep}
        onMouseEnter={highlightStep}
        iconName={hasError || hasWarnings ? 'alert-circle' : iconName}
        title={`${stepNumber}. ${
          step.stepName || t(`stepType.${step.stepType}`)
        }`}
      />
    </>
  )
}
export function getMetaSelectedSteps(
  multiSelectItemIds: StepIdType[] | null,
  stepId: StepIdType,
  selectedStepId: StepIdType | null
): StepIdType[] {
  let stepsToSelect: StepIdType[]
  if (multiSelectItemIds?.length) {
    // already have a selection, add/remove the meta-clicked item
    stepsToSelect = multiSelectItemIds.includes(stepId)
      ? multiSelectItemIds.filter(id => id !== stepId)
      : [...multiSelectItemIds, stepId]
  } else if (selectedStepId && selectedStepId === stepId) {
    // meta-clicked on the selected single step
    stepsToSelect = [selectedStepId]
  } else if (selectedStepId) {
    // meta-clicked on a different step, multi-select both
    stepsToSelect = [selectedStepId, stepId]
  } else {
    // meta-clicked on a step when a terminal item was selected
    stepsToSelect = [stepId]
  }
  return stepsToSelect
}

function getShiftSelectedSteps(
  selectedStepId: StepIdType | null,
  orderedStepIds: StepIdType[],
  stepId: StepIdType,
  multiSelectItemIds: StepIdType[] | null,
  lastMultiSelectedStepId: StepIdType | null
): StepIdType[] {
  let stepsToSelect: StepIdType[]
  if (selectedStepId) {
    stepsToSelect = getOrderedStepsInRange(
      selectedStepId,
      stepId,
      orderedStepIds
    )
  } else if (multiSelectItemIds?.length && lastMultiSelectedStepId) {
    const potentialStepsToSelect = getOrderedStepsInRange(
      lastMultiSelectedStepId,
      stepId,
      orderedStepIds
    )

    const allSelected: boolean = potentialStepsToSelect
      .slice(1)
      .every(stepId => multiSelectItemIds.includes(stepId))

    if (allSelected) {
      // if they're all selected, deselect them all
      if (multiSelectItemIds.length - potentialStepsToSelect.length > 0) {
        stepsToSelect = multiSelectItemIds.filter(
          (id: StepIdType) => !potentialStepsToSelect.includes(id)
        )
      } else {
        // unless deselecting them all results in none being selected
        stepsToSelect = [potentialStepsToSelect[0]]
      }
    } else {
      stepsToSelect = uniq([...multiSelectItemIds, ...potentialStepsToSelect])
    }
  } else {
    stepsToSelect = [stepId]
  }
  return stepsToSelect
}

function getOrderedStepsInRange(
  lastSelectedStepId: StepIdType,
  stepId: StepIdType,
  orderedStepIds: StepIdType[]
): StepIdType[] {
  const prevIndex: number = orderedStepIds.indexOf(lastSelectedStepId)
  const currentIndex: number = orderedStepIds.indexOf(stepId)

  const [startIndex, endIndex] = [prevIndex, currentIndex].sort((a, b) => a - b)
  const orderedSteps = orderedStepIds.slice(startIndex, endIndex + 1)
  return orderedSteps
}
