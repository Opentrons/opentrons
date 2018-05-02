// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {BaseState, ThunkDispatch} from '../types'

import {selectors} from '../steplist/reducers'
import type {StepIdType, SubstepIdentifier} from '../steplist/types'
import {hoverOnSubstep, selectStep, hoverOnStep, toggleStepCollapsed} from '../steplist/actions'
import * as substepSelectors from '../top-selectors/substeps'
import {selectors as fileDataSelectors} from '../file-data'
import StepList from '../components/StepList'

type StepIdTypeWithEnd = StepIdType | '__end__' // TODO import this; also used in StepList

type Props = React.ElementProps<typeof StepList>

type StateProps = {
  steps: $PropertyType<Props, 'steps'>,
  selectedStepId: $PropertyType<Props, 'selectedStepId'>,
  hoveredSubstep: $PropertyType<Props, 'hoveredSubstep'>,
  errorStepId: $PropertyType<Props, 'errorStepId'>,
}

type DispatchProps = $Diff<Props, StateProps>

function mapStateToProps (state: BaseState): StateProps {
  return {
    steps: substepSelectors.allStepsWithSubsteps(state),
    selectedStepId: selectors.hoveredOrSelectedStepId(state),
    hoveredSubstep: selectors.getHoveredSubstep(state),
    errorStepId: fileDataSelectors.robotStateTimelineFull(state).errorStepId // TODO make mini selector
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>): DispatchProps {
  return {
    handleSubstepHover: (payload: SubstepIdentifier) => dispatch(hoverOnSubstep(payload)),

    handleStepItemClickById: (id: StepIdTypeWithEnd) => () => dispatch(selectStep(id)),
    handleStepItemCollapseToggleById: (id: StepIdType) => () => dispatch(toggleStepCollapsed(id)),
    handleStepHoverById: (id: StepIdTypeWithEnd | null) => () => dispatch(hoverOnStep(id))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepList)
