// @flow
import {connect} from 'react-redux'
import type {BaseState, ThunkDispatch} from '../types'

import {selectors} from '../steplist/reducers'
import type {StepIdType} from '../steplist/types'
import {selectStep, hoverOnStep, toggleStepCollapsed} from '../steplist/actions'
import StepList from '../components/StepList'

function mapStateToProps (state: BaseState) {
  return {
    steps: selectors.allSteps(state),
    selectedStepId: selectors.hoveredOrSelectedStepId(state)
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>) {
  return {
    handleStepItemClickById: (id: StepIdType) => () => dispatch(selectStep(id)),
    handleStepItemCollapseToggleById: (id: StepIdType) => () => dispatch(toggleStepCollapsed(id)),
    handleStepHoverById: (id: StepIdType) => () => dispatch(hoverOnStep(id))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepList)
