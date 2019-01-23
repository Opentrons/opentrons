// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import isEmpty from 'lodash/isEmpty'
import type {BaseState, ThunkDispatch} from '../types'

import type {SubstepIdentifier} from '../steplist/types'
import * as substepSelectors from '../top-selectors/substeps'
import {selectors as dismissSelectors} from '../dismiss'
import {selectors as stepFormSelectors} from '../step-forms'
import {selectors as stepsSelectors, actions as stepsActions} from '../ui/steps'
import {selectors as fileDataSelectors} from '../file-data'
import {selectors as labwareIngredSelectors} from '../labware-ingred/selectors'
import StepItem from '../components/steplist/StepItem' // TODO Ian 2018-05-10 why is importing StepItem from index.js not working?

type Props = React.ElementProps<typeof StepItem>

type OP = {
  stepId: $PropertyType<Props, 'stepId'>,
}

type SP = {|
  step: $PropertyType<Props, 'step'>,
  substeps: $PropertyType<Props, 'substeps'>,
  collapsed: $PropertyType<Props, 'collapsed'>,
  error: $PropertyType<Props, 'error'>,
  selected: $PropertyType<Props, 'selected'>,
  hovered: $PropertyType<Props, 'hovered'>,
  hoveredSubstep: $PropertyType<Props, 'hoveredSubstep'>,
  getLabware: $PropertyType<Props, 'getLabware'>,
  ingredNames: $PropertyType<Props, 'ingredNames'>,
|}

type DP = $Diff<$Diff<Props, SP>, OP>

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  const {stepId} = ownProps
  const allSteps = stepFormSelectors.getAllSteps(state)

  const hoveredSubstep = stepsSelectors.getHoveredSubstep(state)
  const hoveredStep = stepsSelectors.getHoveredStepId(state)
  const selected = stepsSelectors.getSelectedStepId(state) === stepId
  const collapsed = stepsSelectors.getCollapsedSteps(state)[stepId]
  const formAndFieldErrors = stepFormSelectors.getFormAndFieldErrorsByStepId(state)[stepId]
  const hasError = fileDataSelectors.getErrorStepId(state) === stepId || !isEmpty(formAndFieldErrors)
  const warnings = (typeof stepId === 'number') // TODO: Ian 2018-07-13 remove when stepId always number
    ? dismissSelectors.getTimelineWarningsPerStep(state)[stepId]
    : []
  const hasWarnings = warnings && warnings.length > 0

  const showErrorState = hasError || hasWarnings

  return {
    step: allSteps[stepId],
    substeps: substepSelectors.allSubsteps(state)[stepId],
    hoveredSubstep,
    collapsed,
    selected,
    error: showErrorState,

    // no double-highlighting: whole step is only "hovered" when
    // user is not hovering on substep.
    hovered: (hoveredStep === stepId) && !hoveredSubstep,

    getLabware: (labwareId: ?string) => labwareId ? labwareIngredSelectors.getLabwareById(state)[labwareId] : null,
    ingredNames: labwareIngredSelectors.getLiquidNamesById(state),
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>, ownProps: OP): DP {
  const {stepId} = ownProps

  return {
    handleSubstepHover: (payload: SubstepIdentifier) => dispatch(stepsActions.hoverOnSubstep(payload)),

    onStepClick: () => dispatch(stepsActions.selectStep(stepId)),
    onStepItemCollapseToggle: () => dispatch(stepsActions.toggleStepCollapsed(stepId)),
    onStepHover: () => dispatch(stepsActions.hoverOnStep(stepId)),
    onStepMouseLeave: () => dispatch(stepsActions.hoverOnStep(null)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepItem)
