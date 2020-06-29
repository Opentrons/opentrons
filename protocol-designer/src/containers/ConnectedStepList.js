// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { StepList } from '../components/steplist'
import type { StepIdType } from '../form-types'
import { selectors as stepFormSelectors } from '../step-forms'
import { actions as steplistActions } from '../steplist'
import type { BaseState, ThunkDispatch } from '../types'
import { actions as stepsActions } from '../ui/steps'

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
      dispatch(stepsActions.reorderSelectedStep(delta))
    },
    reorderSteps: (stepIds: Array<StepIdType>) => {
      dispatch(steplistActions.reorderSteps(stepIds))
    },
  }
}

export const ConnectedStepList: React.AbstractComponent<{||}> = connect<
  Props,
  {||},
  SP,
  DP,
  _,
  _
>(
  mapStateToProps,
  mapDispatchToProps
)(StepList)
