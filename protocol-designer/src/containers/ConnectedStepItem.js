// @flow
import { useConditionalConfirm } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import mapValues from 'lodash/mapValues'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ConfirmDeleteStepModal } from '../components/modals/ConfirmDeleteStepModal'
import { StepItem, StepItemContents } from '../components/steplist/StepItem'
import { selectors as dismissSelectors } from '../dismiss'
import { selectors as fileDataSelectors } from '../file-data'
import type { StepIdType } from '../form-types'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import {
  type LabwareEntity,
  selectors as stepFormSelectors,
} from '../step-forms'
import type { SubstepIdentifier } from '../steplist/types'
import * as substepSelectors from '../top-selectors/substeps'
import * as timelineWarningSelectors from '../top-selectors/timelineWarnings'
import { selectors as uiLabwareSelectors } from '../ui/labware'
import {
  actions as stepsActions,
  getCollapsedSteps,
  getHoveredStepId,
  getHoveredSubstep,
  getSelectedStepId,
} from '../ui/steps'

type Props = {|
  stepId: StepIdType,
  stepNumber: number,
  onStepContextMenu?: () => mixed,
|}

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
  const selected = useSelector(getSelectedStepId) === stepId

  const substeps = useSelector(substepSelectors.allSubsteps)[stepId]

  const ingredNames = useSelector(labwareIngredSelectors.getLiquidNamesById)
  const labwareNicknamesById = useSelector(
    uiLabwareSelectors.getLabwareNicknamesById
  )
  const labwareEntities = useSelector(stepFormSelectors.getLabwareEntities)
  const currentFormIsPresaved = useSelector(
    stepFormSelectors.getCurrentFormIsPresaved
  )
  const labwareDefDisplayNamesById = mapValues(
    labwareEntities,
    (l: LabwareEntity) => getLabwareDisplayName(l.def)
  )

  // Actions
  const dispatch = useDispatch()

  const highlightSubstep = (payload: SubstepIdentifier) =>
    dispatch(stepsActions.hoverOnSubstep(payload))
  const selectStep = () => dispatch(stepsActions.selectStep(stepId))
  const toggleStepCollapsed = () =>
    dispatch(stepsActions.toggleStepCollapsed(stepId))
  const highlightStep = () => dispatch(stepsActions.hoverOnStep(stepId))
  const unhighlightStep = () => dispatch(stepsActions.hoverOnStep(null))

  // step selection is gated when showConfirmation is true
  const { confirm, showConfirmation, cancel } = useConditionalConfirm(
    selectStep,
    currentFormIsPresaved
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
    selectStep: confirm,
    toggleStepCollapsed,
    unhighlightStep,
  }

  const stepItemContentsProps = {
    rawForm: step,
    stepType: step.stepType,
    substeps,

    ingredNames,
    labwareDefDisplayNamesById,
    labwareNicknamesById,

    highlightSubstep,
    hoveredSubstep,
  }

  return (
    <>
      {showConfirmation && (
        <ConfirmDeleteStepModal
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
