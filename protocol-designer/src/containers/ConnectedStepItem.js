// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {BaseState, ThunkDispatch} from '../types'

import type {SubstepIdentifier} from '../steplist/types'
import {hoverOnSubstep, selectStep, hoverOnStep, toggleStepCollapsed} from '../steplist/actions'
import * as substepSelectors from '../top-selectors/substeps'
import {selectors as dismissSelectors} from '../dismiss'
import {selectors as steplistSelectors} from '../steplist'
import {selectors as fileDataSelectors} from '../file-data'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import StepItem from '../components/steplist/StepItem' // TODO Ian 2018-05-10 why is importing StepItem from index.js not working?

type Props = React.ElementProps<typeof StepItem>

type OP = {
  stepId: $PropertyType<Props, 'stepId'>
}

type SP = {|
  step: $PropertyType<Props, 'step'>,
  substeps: $PropertyType<Props, 'substeps'>,
  collapsed: $PropertyType<Props, 'collapsed'>,
  error: $PropertyType<Props, 'error'>,
  selected: $PropertyType<Props, 'selected'>,
  hovered: $PropertyType<Props, 'hovered'>,
  hoveredSubstep: $PropertyType<Props, 'hoveredSubstep'>,
  getLabwareName: $PropertyType<Props, 'getLabwareName'>
|}

type DP = $Diff<$Diff<Props, SP>, OP>

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  const {stepId} = ownProps
  const allSteps = steplistSelectors.allSteps(state)

  const hoveredSubstep = steplistSelectors.getHoveredSubstep(state)
  const hoveredStep = steplistSelectors.getHoveredStepId(state)
  const selected = steplistSelectors.getSelectedStepId(state) === stepId
  const collapsed = steplistSelectors.getCollapsedSteps(state)[stepId]

  const hasError = fileDataSelectors.getErrorStepId(state) === stepId
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

    getLabwareName: (labwareId: ?string) => labwareId && labwareIngredSelectors.getLabwareNames(state)[labwareId]
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>, ownProps: OP): DP {
  const {stepId} = ownProps

  return {
    handleSubstepHover: (payload: SubstepIdentifier) => dispatch(hoverOnSubstep(payload)),

    onStepClick: () => dispatch(selectStep(stepId)),
    onStepItemCollapseToggle: () => dispatch(toggleStepCollapsed(stepId)),
    onStepHover: () => dispatch(hoverOnStep(stepId)),
    onStepMouseLeave: () => dispatch(hoverOnStep(null))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepItem)
