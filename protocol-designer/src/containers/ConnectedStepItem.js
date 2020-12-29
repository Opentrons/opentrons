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
  getMultiSelectLastSelected,
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
  const lastMultiSelectedStepId = useSelector(getMultiSelectLastSelected)
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

    if (isBatchEditEnabled) {
      if (nonePressed([isShiftKeyPressed, isMetaKeyPressed])) {
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
    // no double-highlighting: whole step is only "hovered" when
    // user is not hovering on substep.
    hovered: hoveredStep === stepId && !hoveredSubstep,

    highlightStep,
    handleClick: confirmWithPersistedEvent,
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
    const startIndex: number = orderedStepIds.indexOf(selectedStepId)
    const endIndex: number = orderedStepIds.indexOf(stepId)
    stepsToSelect = orderedStepIds.slice(startIndex, endIndex + 1)
  } else if (multiSelectItemIds?.length) {
    const prevIndex: number = orderedStepIds.indexOf(lastMultiSelectedStepId)
    const currentIndex: number = orderedStepIds.indexOf(stepId)

    const [startIndex, endIndex] = [prevIndex, currentIndex].sort(
      (a, b) => a - b
    )
    const potentialStepsToSelect = orderedStepIds.slice(
      startIndex,
      endIndex + 1
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
      stepsToSelect = [
        ...new Set([...multiSelectItemIds, ...potentialStepsToSelect]),
      ]
    }
  } else {
    stepsToSelect = [stepId]
  }
  return stepsToSelect
}
