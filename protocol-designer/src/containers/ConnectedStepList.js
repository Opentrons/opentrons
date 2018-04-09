// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {BaseState, ThunkDispatch} from '../types'

import {selectors} from '../steplist/reducers'
import type {StepIdType, SelectSubstepPayload} from '../steplist/types'
import {selectSubstep, selectStep, hoverOnStep, toggleStepCollapsed} from '../steplist/actions'
import StepList from '../components/StepList'

type StepIdTypeWithEnd = StepIdType | '__end__' // TODO import this; also used in StepList

type Props = React.ElementProps<typeof StepList>

type StateProps = {
  selectedStepId: $PropertyType<Props, 'selectedStepId'>,
  steps: $PropertyType<Props, 'steps'>
}

type DispatchProps = $Diff<Props, StateProps>

function mapStateToProps (state: BaseState): StateProps {
  return {
    steps: selectors.allSteps(state),
    selectedStepId: selectors.hoveredOrSelectedStepId(state)
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>): DispatchProps {
  return {
    handleSubstepHover: (payload: SelectSubstepPayload) => dispatch(selectSubstep(payload)),

    handleStepItemClickById: (id: StepIdTypeWithEnd) => () => dispatch(selectStep(id)),
    handleStepItemCollapseToggleById: (id: StepIdType) => () => dispatch(toggleStepCollapsed(id)),
    handleStepHoverById: (id: StepIdTypeWithEnd | null) => () => dispatch(hoverOnStep(id))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepList)
