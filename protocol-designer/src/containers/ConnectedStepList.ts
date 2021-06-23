import { connect } from 'react-redux'
import { BaseState, ThunkDispatch } from '../types'
import { StepIdType } from '../form-types'
import { actions as steplistActions } from '../steplist'
import { actions as stepsActions, getIsMultiSelectMode } from '../ui/steps'
import { selectors as stepFormSelectors } from '../step-forms'
import { StepList, StepListProps } from '../components/steplist'

type Props = StepListProps
interface SP {
  orderedStepIds: Props['orderedStepIds']
  isMultiSelectMode: boolean | null | undefined
}
type DP = Omit<Props, keyof SP>

function mapStateToProps(state: BaseState): SP {
  return {
    orderedStepIds: stepFormSelectors.getOrderedStepIds(state),
    isMultiSelectMode: getIsMultiSelectMode(state),
  }
}

function mapDispatchToProps(dispatch: ThunkDispatch<any>): DP {
  return {
    reorderSelectedStep: (delta: number) => {
      dispatch(stepsActions.reorderSelectedStep(delta))
    },
    reorderSteps: (stepIds: StepIdType[]) => {
      dispatch(steplistActions.reorderSteps(stepIds))
    },
  }
}

export const ConnectedStepList = connect(
  mapStateToProps,
  mapDispatchToProps
)(StepList)
