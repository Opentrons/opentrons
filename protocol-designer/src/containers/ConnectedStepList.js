// @flow
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import type {ActionType} from 'redux-actions'

import {selectors} from '../steplist/reducers'
import {selectStep, toggleStepCollapsed} from '../steplist/actions'
import StepList from '../components/StepList'

function mapStateToProps (state) {
  return {
    steps: selectors.allSteps(state),
    selectedStepId: selectors.selectedStepId(state)
  }
}

function mapDispatchToProps (dispatch: Dispatch<
  | ActionType<typeof selectStep>
  | ActionType<typeof toggleStepCollapsed>
>) {
  return {
    handleStepItemClickById: id => e => dispatch(selectStep(id)),
    handleStepItemCollapseToggleById: id => e => dispatch(toggleStepCollapsed(id))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepList)
