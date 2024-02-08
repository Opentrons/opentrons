import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import uniq from 'lodash/uniq'
import UAParser from 'ua-parser-js'
import { useConditionalConfirm } from '@opentrons/components'

import { selectors as uiLabwareSelectors } from '../ui/labware'
import * as timelineWarningSelectors from '../top-selectors/timelineWarnings'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import { selectors as dismissSelectors } from '../dismiss'
import { selectors as stepFormSelectors } from '../step-forms'
import {
  actions as stepsActions,
  getCollapsedSteps,
  getHoveredStepId,
  getHoveredSubstep,
  getIsMultiSelectMode,
  getMultiSelectItemIds,
  getMultiSelectLastSelected,
  getSelectedStepId,
  HoverOnStepAction,
  HoverOnSubstepAction,
  ToggleStepCollapsedAction,
  SelectMultipleStepsAction,
} from '../ui/steps'
import { selectors as fileDataSelectors } from '../file-data'

import {
  StepItem,
  StepItemContents,
  StepItemContentsProps,
  StepItemProps,
} from '../components/steplist/StepItem'
import {
  CLOSE_BATCH_EDIT_FORM,
  CLOSE_STEP_FORM_WITH_CHANGES,
  CLOSE_UNSAVED_STEP_FORM,
  ConfirmDeleteModal,
  DeleteModalType,
} from '../components/modals/ConfirmDeleteModal'

import { SubstepIdentifier } from '../steplist/types'
import { StepIdType } from '../form-types'
import { BaseState, ThunkAction } from '../types'
import { getAdditionalEquipmentEntities } from '../step-forms/selectors'
import { ThunkDispatch } from 'redux-thunk'

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

export const ConnectedStepItem = (
  props: ConnectedStepItemProps
): JSX.Element => {
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
  const lastMultiSelectedStepId = useSelector(getMultiSelectLastSelected)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const selected: boolean = multiSelectItemIds?.length
    ? multiSelectItemIds.includes(stepId)
    : selectedStepId === stepId

  const substeps = useSelector(fileDataSelectors.getSubsteps)[stepId]

  const ingredNames = useSelector(labwareIngredSelectors.getLiquidNamesById)
  const labwareNicknamesById = useSelector(
    uiLabwareSelectors.getLabwareNicknamesById
  )
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
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

  const highlightSubstep = (payload: SubstepIdentifier): HoverOnSubstepAction =>
    dispatch(stepsActions.hoverOnSubstep(payload))
  const selectStep = (): ThunkAction<any> =>
    dispatch(stepsActions.selectStep(stepId))
  const selectMultipleSteps = (
    steps: StepIdType[],
    lastSelected: StepIdType
  ): ThunkAction<SelectMultipleStepsAction> =>
    dispatch(stepsActions.selectMultipleSteps(steps, lastSelected))
  const toggleStepCollapsed = (): ToggleStepCollapsedAction =>
    dispatch(stepsActions.toggleStepCollapsed(stepId))
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

  const stepItemProps: StepItemProps = {
    description: step.stepDetails,
    rawForm: step,
    stepNumber,
    stepType: step.stepType,
    title: step.stepName,

    collapsed,
    error: hasError,
    warning: hasWarnings,
    selected,
    isLastSelected: lastMultiSelectedStepId === stepId,
    // no double-highlighting: whole step is only "hovered" when
    // user is not hovering on substep.
    hovered: hoveredStep === stepId && !hoveredSubstep,

    highlightStep,
    handleClick: confirm,
    toggleStepCollapsed,
    unhighlightStep,
    isMultiSelectMode,
  }

  const stepItemContentsProps: StepItemContentsProps = {
    rawForm: step,
    stepType: step.stepType,
    substeps,
    ingredNames,
    labwareNicknamesById,
    additionalEquipmentEntities,
    highlightSubstep,
    hoveredSubstep,
  }

  const getModalType = (): DeleteModalType => {
    if (isMultiSelectMode) {
      return CLOSE_BATCH_EDIT_FORM
    } else if (currentFormIsPresaved) {
      return CLOSE_UNSAVED_STEP_FORM
    } else {
      return CLOSE_STEP_FORM_WITH_CHANGES
    }
  }

  return (
    <>
      {showConfirmation && (
        <ConfirmDeleteModal
          modalType={getModalType()}
          onContinueClick={confirm}
          onCancelClick={cancel}
        />
      )}
      <StepItem {...stepItemProps} onStepContextMenu={props.onStepContextMenu}>
        {/* @ts-expect-error(sa, 2021-6-21): StepItemContents might return a list of JSX elements */}
        <StepItemContents {...stepItemContentsProps} />
      </StepItem>
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
