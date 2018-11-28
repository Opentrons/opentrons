// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {BaseState, ThunkDispatch} from '../types'

import {
  actions as steplistActions,
  selectors as steplistSelectors,
} from '../steplist'
import {StepList} from '../components/steplist'

type Props = React.ElementProps<typeof StepList>

type SP = {
  orderedSteps: $PropertyType<Props, 'orderedSteps'>,
}

type DP = $Diff<Props, SP>

function mapStateToProps (state: BaseState): SP {
  return {
    orderedSteps: steplistSelectors.getOrderedSteps(state),
  }
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>): DP {
  return {
    reorderSelectedStep: (delta: number) =>
      dispatch(steplistActions.reorderSelectedStep(delta)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepList)
