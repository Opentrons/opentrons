// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {BaseState, ThunkDispatch} from '../types'

import type {SubstepIdentifier} from '../steplist/types'
import {hoverOnSubstep, selectStep, hoverOnStep, toggleStepCollapsed} from '../steplist/actions'
import * as substepSelectors from '../top-selectors/substeps'
import {selectors as steplistSelectors} from '../steplist/reducers'
import {selectors as fileDataSelectors} from '../file-data'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import StepItem from '../components/steplist/StepItem' // TODO IMMEDIATELY use index.js

type Props = React.ElementProps<typeof StepItem>

type OP = {
  stepId: $PropertyType<Props, 'stepId'>
}

type SP = {
  step: $PropertyType<Props, 'step'>,
  substeps: $PropertyType<Props, 'substeps'>,
  collapsed: $PropertyType<Props, 'collapsed'>,
  error: $PropertyType<Props, 'error'>,
  selected: $PropertyType<Props, 'selected'>,
  hoveredSubstep: $PropertyType<Props, 'hoveredSubstep'>,
  getLabwareName: $PropertyType<Props, 'getLabwareName'>
}

type DP = $Diff<$Diff<Props, SP>, OP>

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  const {stepId} = ownProps
  const allSteps = steplistSelectors.allSteps(state)
  const allLabware = labwareIngredSelectors.getLabware(state)

  return {
    step: (stepId === '__end__') // TODO IMMEDIATELY can't use END_STEP, flow :(
      ? null
      : allSteps[stepId],

    substeps: (stepId === '__end__' || stepId === 0) // TODO IMMEDIATELY can't use END_STEP, flow :(
      ? null
      : substepSelectors.allSubsteps(state)[stepId],

    hoveredSubstep: steplistSelectors.getHoveredSubstep(state),

    collapsed: (stepId === '__end__' || stepId === 0) // TODO IMMEDIATELY can't use END_STEP, flow :(
      ? undefined
      : steplistSelectors.getCollapsedSteps(state)[stepId],

    selected: steplistSelectors.hoveredOrSelectedStepId(state) === stepId,
    hovered: steplistSelectors.getHoveredSubstep(state) === stepId,
    error: fileDataSelectors.robotStateTimelineFull(state).errorStepId === stepId, // TODO make mini selector

    getLabwareName: (labwareId: ?string): ?string =>
      labwareId && allLabware[labwareId] && allLabware[labwareId].name // TODO make mini selector
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>, ownProps: OP): DP {
  const {stepId} = ownProps

  return {
    handleSubstepHover: (payload: SubstepIdentifier) => dispatch(hoverOnSubstep(payload)),

    onStepClick: () => dispatch(selectStep(stepId)),
    onStepItemCollapseToggle: (stepId === '__end__' || stepId === 0) // TODO IMMEDIATELY can't use END_STEP, flow :(
      ? undefined
      : () => dispatch(toggleStepCollapsed(stepId)),
    onStepHover: () => dispatch(hoverOnStep(stepId)),
    onStepMouseLeave: () => dispatch(hoverOnStep(null))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepItem)
