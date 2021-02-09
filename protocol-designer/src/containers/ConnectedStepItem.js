// @flow
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
  getCollapsedSteps,
  getHoveredSubstep,
  getHoveredStepId,
  getSelectedStepId,
  getMultiSelectItemIds,
  getMultiSelectLastSelected,
  getIsMultiSelectMode,
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

const getMouseClickKeyInfo = (
  event: SyntheticMouseEvent<>
): {| isShiftKeyPressed: boolean, isMetaKeyPressed: boolean |} => {
  const isMac: boolean = getUserOS() === 'Mac OS'
  const isShiftKeyPressed: boolean = event.shiftKey
  const isMetaKeyPressed: boolean =
    (isMac && event.metaKey) || (!isMac && event.ctrlKey)
  return { isShiftKeyPressed, isMetaKeyPressed }
}

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

  const handleStepItemSelection = (event: SyntheticMouseEvent<>): void => {
    const { isShiftKeyPressed, isMetaKeyPressed } = getMouseClickKeyInfo(event)
    let stepsToSelect: Array<StepIdType> = []

    // if user clicked on the last multi-selected step, shift/meta keys don't matter
    const toggledLastSelected = stepId === lastMultiSelectedStepId
    const noModifierKeys =
      nonePressed([isShiftKeyPressed, isMetaKeyPressed]) || toggledLastSelected

    if (isBatchEditEnabled) {
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
    } else {
      selectStep()
    }
  }

  // step selection is gated when showConfirmation is true
  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    handleStepItemSelection,
    currentFormIsPresaved || formHasChanges
  )
  // (SA 2020/12/23): This will not be needed once we update to React 17
  // since event pooling will be eliminated
  const confirmWithPersistedEvent = (event: SyntheticMouseEvent<>): void => {
    event.persist()
    confirm(event)
  }

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
    isLastSelected: lastMultiSelectedStepId === stepId,
    // no double-highlighting: whole step is only "hovered" when
    // user is not hovering on substep.
    hovered: hoveredStep === stepId && !hoveredSubstep,

    highlightStep,
    handleClick: confirmWithPersistedEvent,
    toggleStepCollapsed,
    unhighlightStep,
    isMultiSelectMode,
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
          onContinueClick={confirmWithPersistedEvent}
          onCancelClick={cancel}
        />
      )}
      <StepItem {...stepItemProps} onStepContextMenu={props.onStepContextMenu}>
        <StepItemContents {...stepItemContentsProps} />
      </StepItem>
    </>
  )
}
function getMetaSelectedSteps(multiSelectItemIds, stepId, selectedStepId) {
  let stepsToSelect: Array<StepIdType> = []
  if (multiSelectItemIds?.length) {
    stepsToSelect = multiSelectItemIds.includes(stepId)
      ? multiSelectItemIds.filter(id => id !== stepId)
      : [...multiSelectItemIds, stepId]
  } else if (selectedStepId) {
    stepsToSelect = [selectedStepId, stepId]
  } else {
    stepsToSelect = [stepId]
  }
  return stepsToSelect
}

function getShiftSelectedSteps(
  selectedStepId,
  orderedStepIds,
  stepId,
  multiSelectItemIds,
  lastMultiSelectedStepId
) {
  let stepsToSelect: Array<StepIdType>
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
          id => !potentialStepsToSelect.includes(id)
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
  orderedStepIds: Array<StepIdType>
) {
  const prevIndex: number = orderedStepIds.indexOf(lastSelectedStepId)
  const currentIndex: number = orderedStepIds.indexOf(stepId)

  const [startIndex, endIndex] = [prevIndex, currentIndex].sort((a, b) => a - b)
  const orderedSteps = orderedStepIds.slice(startIndex, endIndex + 1)
  return orderedSteps
}
