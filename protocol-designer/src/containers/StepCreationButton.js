// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import StepCreationButton from '../components/StepCreationButton'

import {addStep, expandAddStepButton} from '../steplist/actions'
import {selectors} from '../steplist'
import type {StepType} from '../form-types'
import type {BaseState, ThunkDispatch} from '../types'

type Props = React.ElementProps<typeof StepCreationButton>

type StateProps = {
  expanded: $PropertyType<Props, 'expanded'>,
}

type DispatchProps = $Diff<Props, StateProps>

function mapStateToProps (state: BaseState): StateProps {
  return ({
    expanded: selectors.stepCreationButtonExpanded(state),
  })
}

function mapDispatchToProps (dispatch: ThunkDispatch<*>): DispatchProps {
  return {
    onStepClick: (stepType: StepType) => () => dispatch(addStep({stepType})),
    onExpandClick: () => dispatch(expandAddStepButton(true)),
    onClickAway: () => dispatch(expandAddStepButton(false)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepCreationButton)
