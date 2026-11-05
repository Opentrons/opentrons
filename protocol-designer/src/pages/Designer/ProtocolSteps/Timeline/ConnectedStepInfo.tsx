import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import debounce from 'lodash/debounce'

import { useConditionalConfirm } from '@opentrons/components'

import {
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_UNSAVED_STEP_FORM,
  ConfirmDeleteModal,
} from '/protocol-designer/components/organisms'
import { selectors as dismissSelectors } from '/protocol-designer/dismiss'
import { selectors as fileDataSelectors } from '/protocol-designer/file-data'
import { stepIconsByType } from '/protocol-designer/form-types'
import { selectors as stepFormSelectors } from '/protocol-designer/step-forms'
import { getOrderedStepIds } from '/protocol-designer/step-forms/selectors'
import * as timelineWarningSelectors from '/protocol-designer/top-selectors/timelineWarnings'
import {
  getHoveredStepId,
  getHoveredSubstep,
  getIsMultiSelectMode,
  getMultiSelectItemIds,
  getMultiSelectLastSelected,
  getSelectedStepId,
  actions as stepsActions,
} from '/protocol-designer/ui/steps'
import {
  hoverOnStep,
  toggleViewSubstep,
} from '/protocol-designer/ui/steps/actions/actions'

import { ConnectedStepContainer } from './ConnectedStepContainer'
import { useStepText } from './useStepText'
import {
  getMetaSelectedSteps,
  getMouseClickKeyInfo,
  getShiftSelectedSteps,
  nonePressed,
} from './utils'

import type { ThunkDispatch } from 'redux-thunk'
import type { Dispatch, MouseEvent, ReactNode, SetStateAction } from 'react'
import type { DeleteModalType } from '/protocol-designer/components/organisms'
import type { StepIdType } from '/protocol-designer/form-types'
import type { BaseState, ThunkAction } from '/protocol-designer/types'
import type { SelectMultipleStepsAction } from '/protocol-designer/ui/steps'

export interface ConnectedStepInfoProps {
  stepId: StepIdType
  openedOverflowMenuId?: string | null
  setOpenedOverflowMenuId?: Dispatch<SetStateAction<string | null>>
  sidebarWidth: number
}

// This debounce reduces flickering when the cursor moves across steps in the timeline.
// Although there's no hover gap between adjacent `StepContainer`s (they have a visual
// gap but it's made out of internal padding), there are hover gaps in `ConcurrentStepGroup`s.
const DEBOUNCE_DURATION_MS = 500

// todo(mm, 2025-11-14): I've made a mess of ConnectedStepInfo and ConnectedStepContainer.
// We should try to either merge them, or clarify each one's responsibilities.
export function ConnectedStepInfo(props: ConnectedStepInfoProps): ReactNode {
  const {
    stepId,
    openedOverflowMenuId,
    setOpenedOverflowMenuId,
    sidebarWidth,
  } = props
  const dispatch = useDispatch<ThunkDispatch<BaseState, any, any>>()
  const stepIds = useSelector(getOrderedStepIds)
  const step = useSelector(stepFormSelectors.getSavedStepForms)[stepId]
  const stepNumber = useSelector(stepFormSelectors.getUserVisibleStepNumbers)[
    stepId
  ]
  const argsAndErrors = useSelector(stepFormSelectors.getArgsAndErrorsByStepId)[
    stepId
  ]
  const selectedStep = useSelector(getSelectedStepId)
  const errorStepId = useSelector(fileDataSelectors.getErrorStepId)
  const hasError = errorStepId === stepId || argsAndErrors.errors != null
  const hasTimelineWarningsPerStep = useSelector(
    timelineWarningSelectors.getHasTimelineWarningsPerStep
  )
  const hasFormLevelWarningsPerStep = useSelector(
    dismissSelectors.getHasFormLevelWarningsPerStep
  )
  const stepListAfterErrors =
    errorStepId != null ? stepIds.slice(stepIds.indexOf(errorStepId) + 1) : []
  const stepAfterError =
    stepId != null ? stepListAfterErrors.includes(stepId) : false
  const { text, subtext } = useStepText(step)

  const hasWarnings =
    hasTimelineWarningsPerStep[stepId] || hasFormLevelWarningsPerStep[stepId]
  const hoveredSubstep = useSelector(getHoveredSubstep)
  const hoveredStep = useSelector(getHoveredStepId)
  const selectedStepId = useSelector(getSelectedStepId)
  const multiSelectItemIds = useSelector(getMultiSelectItemIds)
  const stepHierarchy = useSelector(stepFormSelectors.getSavedStepHierarchy)
  const lastMultiSelectedStepId = useSelector(getMultiSelectLastSelected)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const selected: boolean =
    multiSelectItemIds != null && multiSelectItemIds.length > 0
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
  const selectMultipleSteps = (
    steps: StepIdType[],
    lastSelected: StepIdType
  ): ThunkAction<SelectMultipleStepsAction> =>
    dispatch(stepsActions.selectMultipleSteps(steps, lastSelected))

  const debouncedUnhighlightStep = useMemo(
    () =>
      debounce(() => {
        dispatch(stepsActions.hoverOnStep(null))
      }, DEBOUNCE_DURATION_MS),
    [dispatch]
  )

  const selectStep = (): ThunkAction<any> =>
    dispatch(stepsActions.resetSelectStep(stepId))
  const selectStepOnDoubleClick = (): ThunkAction<any> =>
    dispatch(stepsActions.selectStep(stepId))
  const handleSelectStep = (event: MouseEvent): void => {
    if (selectedStep !== stepId) {
      dispatch(toggleViewSubstep(null))
      dispatch(hoverOnStep(null))
    }
    const { isShiftKeyPressed, isMetaKeyPressed } = getMouseClickKeyInfo(event)
    let stepsToSelect: StepIdType[] = []

    // if user clicked on the last multi-selected step, shift/meta keys don't matter
    const toggledLastSelected = stepId === lastMultiSelectedStepId
    const noModifierKeys =
      nonePressed([isShiftKeyPressed, isMetaKeyPressed]) || toggledLastSelected

    if (noModifierKeys) {
      selectStep()
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
          stepHierarchy,
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
    if (stepsToSelect.length > 0) {
      selectMultipleSteps(stepsToSelect, stepId)
    }
  }
  const handleSelectDoubleStep = (): void => {
    selectStepOnDoubleClick()

    if (selectedStep !== stepId) {
      dispatch(toggleViewSubstep(null))
      dispatch(hoverOnStep(null))
    }
  }

  const {
    confirm: confirmDoubleClick,
    showConfirmation: showConfirmationDoubleClick,
    cancel: cancelDoubleClick,
  } = useConditionalConfirm(
    handleSelectDoubleStep,
    currentFormIsPresaved || singleEditFormHasUnsavedChanges
  )

  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    handleSelectStep,
    isMultiSelectMode
      ? batchEditFormHasUnsavedChanges
      : currentFormIsPresaved || singleEditFormHasUnsavedChanges
  )

  const getModalType = (): DeleteModalType => {
    if (currentFormIsPresaved) {
      return CLOSE_UNSAVED_STEP_FORM
    } else {
      return CLOSE_STEP_FORM_WITH_CHANGES
    }
  }

  const iconName = stepIconsByType[step.stepType]

  const handleMouseEnter = (): void => {
    debouncedUnhighlightStep.cancel()
    dispatch(stepsActions.hoverOnStep(stepId))
  }

  const handleMouseLeave = (): void => {
    debouncedUnhighlightStep()
  }

  useEffect(() => {
    return () => {
      debouncedUnhighlightStep.cancel()
    }
  }, [debouncedUnhighlightStep, hoveredStep, stepId])

  return (
    <>
      {showConfirmationDoubleClick && (
        <ConfirmDeleteModal
          modalType={getModalType()}
          onContinueClick={confirmDoubleClick}
          onCancelClick={cancelDoubleClick}
        />
      )}
      {showConfirmation && (
        <ConfirmDeleteModal
          modalType={getModalType()}
          onContinueClick={confirm}
          onCancelClick={cancel}
        />
      )}
      <ConnectedStepContainer
        openedOverflowMenuId={openedOverflowMenuId}
        setOpenedOverflowMenuId={setOpenedOverflowMenuId}
        hasError={hasError}
        isStepAfterError={stepAfterError}
        stepId={stepId}
        onMouseLeave={handleMouseLeave}
        selected={selected}
        onDoubleClick={confirmDoubleClick}
        onClick={confirm}
        hovered={hoveredStep === stepId && !hoveredSubstep}
        onMouseEnter={handleMouseEnter}
        iconName={hasError || hasWarnings ? 'ot-alert' : iconName}
        stepNumber={stepNumber}
        text={text}
        subtext={subtext}
        sidebarWidth={sidebarWidth}
      />
    </>
  )
}
