import * as React from 'react'
import {connect} from 'react-redux'

import {PrimaryButton} from '@opentrons/components'
import {addStep, expandAddStepButton} from '../steplist/actions'

// TODO factor out
type StepType = 'transfer'
  | 'distribute'
  | 'consolidate'
  | 'mix'
  | 'pause'
  | 'deck setup'

type StepCreationButtonProps = {
  onStepClick?: StepType => (event?: SyntheticEvent<>) => void,
  onExpandClick?: (event?: SyntheticEvent<>) => void,
  expanded?: boolean
}

function StepCreationButton (props: StepCreationButtonProps) {
  return (
    props.expanded
    ? <div>
      <PrimaryButton
        onClick={props.onStepClick('transfer')}
        iconName='arrow right'
      >
        Transfer
      </PrimaryButton>
      <PrimaryButton
        onClick={props.onStepClick('distribute')}
        iconName='distribute'
      >Distribute
      </PrimaryButton>
    </div>
    : <PrimaryButton onClick={props.onExpandClick}>+ Add Action</PrimaryButton>
  )
}

function mapStateToProps (state) {
  return ({
    expanded: state.steplist.stepCreationButtonExpanded // TODO use selector after factoring redux state
  })
}

function mapDispatchToProps (dispatch) {
  return {
    onStepClick: stepType => e => dispatch(addStep({type: stepType, collapsed: false})),
    onExpandClick: () => dispatch(expandAddStepButton)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepCreationButton)
