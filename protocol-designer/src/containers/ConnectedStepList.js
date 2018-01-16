// @flow
import {connect} from 'react-redux'

import {selectors} from '../steplist/reducers'
import StepList from '../components/StepList'

function mapStateToProps (state) {
  return {
    steps: selectors.allSteps(state),
    selectedStepId: selectors.selectedStepId(state)
  }
}

function mapDispatchToProps (dispatch) {
  return {
    handleStepItemClickById: id => e => dispatch({type: 'SELECT_STEP', payload: id}),
    handleStepItemCollapseToggleById: id => e => dispatch({type: 'TOGGLE_STEP_COLLAPSED', payload: id})
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepList)
