// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import mapValues from 'lodash/mapValues'
import { getLabwareDisplayName } from '@opentrons/shared-data'

import type { SubstepIdentifier } from '../steplist/types'
import * as substepSelectors from '../top-selectors/substeps'
import * as timelineWarningSelectors from '../top-selectors/timelineWarnings'
import { selectors as dismissSelectors } from '../dismiss'
import {
  selectors as stepFormSelectors,
  type LabwareEntity,
} from '../step-forms'
import {
  getCollapsedSteps,
  getHoveredSubstep,
  getHoveredStepId,
  getSelectedStepId,
  actions as stepsActions,
} from '../ui/steps'
import { selectors as fileDataSelectors } from '../file-data'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import { selectors as uiLabwareSelectors } from '../ui/labware'
import { StepItem } from '../components/steplist/StepItem' // TODO Ian 2018-05-10 why is importing StepItem from index.js not working?
import type { StepIdType } from '../form-types'

type StepItemProps = React.ElementProps<typeof StepItem>
type Props = {|
  stepId: StepIdType,
  stepNumber: number,
|}

export const ConnectedStepItem = (props: Props) => {
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
  const labwareDefDisplayNamesById = mapValues(
    labwareEntities,
    (l: LabwareEntity) => getLabwareDisplayName(l.def)
  )

  // Actions
  const dispatch = useDispatch()

  const highlightSubstep = (payload: SubstepIdentifier) =>
    dispatch(stepsActions.hoverOnSubstep(payload))
  const selectStep = stepId => dispatch(stepsActions.selectStep(stepId))
  const toggleStepCollapsed = stepId =>
    dispatch(stepsActions.toggleStepCollapsed(stepId))
  const highlightStep = stepId => dispatch(stepsActions.hoverOnStep(stepId))
  const unhighlightStep = stepId => dispatch(stepsActions.hoverOnStep(null))

  const childProps: StepItemProps = {
    stepNumber,
    stepId,
    stepType: step.stepType,
    title: step.stepName,
    description: step.description,
    rawForm: step,
    substeps,
    hoveredSubstep,
    collapsed,
    selected,
    error: hasError,
    warning: hasWarnings,

    // no double-highlighting: whole step is only "hovered" when
    // user is not hovering on substep.
    hovered: hoveredStep === stepId && !hoveredSubstep,

    labwareNicknamesById,
    labwareDefDisplayNamesById,
    ingredNames,
    highlightSubstep,
    selectStep,
    toggleStepCollapsed,
    highlightStep,
    unhighlightStep,
  }

  return <StepItem {...childProps} />
}
