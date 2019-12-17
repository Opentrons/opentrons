// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import mapValues from 'lodash/mapValues'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import type { BaseState, ThunkDispatch } from '../types'

import type { SubstepIdentifier } from '../steplist/types'
import * as substepSelectors from '../top-selectors/substeps'
import * as timelineWarningSelectors from '../top-selectors/timelineWarnings'
import { selectors as dismissSelectors } from '../dismiss'
import {
  selectors as stepFormSelectors,
  type LabwareEntity,
} from '../step-forms'
import {
  selectors as stepsSelectors,
  actions as stepsActions,
} from '../ui/steps'
import { selectors as fileDataSelectors } from '../file-data'
import { selectors as labwareIngredSelectors } from '../labware-ingred/selectors'
import { selectors as uiLabwareSelectors } from '../ui/labware'
import StepItem from '../components/steplist/StepItem' // TODO Ian 2018-05-10 why is importing StepItem from index.js not working?

type Props = React.ElementProps<typeof StepItem>

type OP = {|
  stepId: $PropertyType<Props, 'stepId'>,
  stepNumber: $PropertyType<Props, 'stepNumber'>,
|}

type SP = {|
  stepType: $PropertyType<Props, 'stepType'>,
  title: $PropertyType<Props, 'title'>,
  description: $PropertyType<Props, 'description'>,
  rawForm: $PropertyType<Props, 'rawForm'>,
  substeps: $PropertyType<Props, 'substeps'>,
  collapsed: $PropertyType<Props, 'collapsed'>,
  error: $PropertyType<Props, 'error'>,
  warning: $PropertyType<Props, 'warning'>,
  selected: $PropertyType<Props, 'selected'>,
  hovered: $PropertyType<Props, 'hovered'>,
  hoveredSubstep: $PropertyType<Props, 'hoveredSubstep'>,
  labwareNicknamesById: $PropertyType<Props, 'labwareNicknamesById'>,
  labwareDefDisplayNamesById: $PropertyType<
    Props,
    'labwareDefDisplayNamesById'
  >,
  ingredNames: $PropertyType<Props, 'ingredNames'>,
|}

type DP = $Diff<$Diff<$Exact<Props>, SP>, OP>

const makeMapStateToProps: () => (BaseState, OP) => SP = () => {
  const getArgsAndErrors = stepFormSelectors.makeGetArgsAndErrorsWithId()
  const getStep = stepFormSelectors.makeGetStepWithId()

  return (state, ownProps) => {
    const { stepId } = ownProps

    const argsAndErrors = getArgsAndErrors(state, { stepId })
    const step = getStep(state, { stepId })

    const hasError =
      fileDataSelectors.getErrorStepId(state) === stepId ||
      argsAndErrors.errors !== undefined

    const hasWarnings =
      timelineWarningSelectors.getHasTimelineWarningsPerStep(state)[stepId] ||
      dismissSelectors.getHasFormLevelWarningsPerStep(state)[stepId]

    const collapsed = stepsSelectors.getCollapsedSteps(state)[stepId]

    const hoveredSubstep = stepsSelectors.getHoveredSubstep(state)
    const hoveredStep = stepsSelectors.getHoveredStepId(state)
    const selected = stepsSelectors.getSelectedStepId(state) === stepId

    return {
      stepType: step.stepType,
      title: step.title,
      description: step.description,
      rawForm: step.formData,
      substeps: substepSelectors.allSubsteps(state)[stepId],
      hoveredSubstep,
      collapsed,
      selected,
      error: hasError,
      warning: hasWarnings,

      // no double-highlighting: whole step is only "hovered" when
      // user is not hovering on substep.
      hovered: hoveredStep === stepId && !hoveredSubstep,

      labwareNicknamesById: uiLabwareSelectors.getLabwareNicknamesById(state),
      labwareDefDisplayNamesById: mapValues(
        stepFormSelectors.getLabwareEntities(state),
        (l: LabwareEntity) => getLabwareDisplayName(l.def)
      ),
      ingredNames: labwareIngredSelectors.getLiquidNamesById(state),
    }
  }
}

function mapDispatchToProps(dispatch: ThunkDispatch<*>): DP {
  return {
    highlightSubstep: (payload: SubstepIdentifier) =>
      dispatch(stepsActions.hoverOnSubstep(payload)),
    selectStep: stepId => dispatch(stepsActions.selectStep(stepId)),
    toggleStepCollapsed: stepId =>
      dispatch(stepsActions.toggleStepCollapsed(stepId)),
    highlightStep: stepId => dispatch(stepsActions.hoverOnStep(stepId)),
    unhighlightStep: stepId => dispatch(stepsActions.hoverOnStep(null)),
  }
}

export default connect<Props, OP, SP, DP, _, _>(
  makeMapStateToProps,
  mapDispatchToProps
)(StepItem)
