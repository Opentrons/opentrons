// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import type { BaseState, ThunkDispatch } from '../types'
import type { StepIdType } from '../form-types'

import { actions as steplistActions } from '../steplist'
import { selectors as stepFormSelectors } from '../step-forms'
import { StepList } from '../components/steplist'

type Props = React.ElementProps<typeof StepList>

type SP = {| orderedStepIds: $PropertyType<Props, 'orderedStepIds'> |}

type DP = $Diff<$Exact<Props>, SP>

function mapStateToProps(state: BaseState): SP {
  return {
    orderedStepIds: stepFormSelectors.getOrderedStepIds(state),
  }
}

function mapDispatchToProps(dispatch: ThunkDispatch<*>): DP {
  return {
    reorderSelectedStep: (delta: number) => {
      dispatch(steplistActions.reorderSelectedStep(delta))
    },
    reorderSteps: (stepIds: Array<StepIdType>) => {
      dispatch(steplistActions.reorderSteps(stepIds))
    },
  }
}

export default connect<Props, {||}, SP, DP, _, _>(
  mapStateToProps,
  mapDispatchToProps
)(StepList)
