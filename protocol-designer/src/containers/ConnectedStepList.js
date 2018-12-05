// @flow
import * as React from 'react'
import HTML5Backend from 'react-dnd-html5-backend'
import {connect} from 'react-redux'
import { DragDropContext } from 'react-dnd'
import type {BaseState, ThunkDispatch} from '../types'
import type {StepIdType} from '../form-types'

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
    reorderSelectedStep: (delta: number) => {
      dispatch(steplistActions.reorderSelectedStep(delta))
    },
    reorderSteps: (stepIds: Array<StepIdType>) => {
      dispatch(steplistActions.reorderSteps(stepIds))
    },
  }
}

export default DragDropContext(HTML5Backend)(connect(mapStateToProps, mapDispatchToProps)(StepList))
