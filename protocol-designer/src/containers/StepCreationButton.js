import * as React from 'react'
import {connect} from 'react-redux'

import {PrimaryButton} from '@opentrons/components'
import {addStep, expandAddStepButton} from '../steplist/actions'
import {selectors} from '../steplist/reducers'

// TODO factor out Step types
type StepType = 'transfer'
  | 'distribute'
  | 'consolidate'
  | 'mix'
  | 'pause'
  | 'deck setup'

type StepCreationButtonProps = {
  onStepClick?: StepType => (event?: SyntheticEvent<>) => void,
  onExpandClick?: (event?: SyntheticEvent<>) => void,
  onClickAway?: (event?: SyntheticEvent<>) => void,
  expanded?: boolean
}

class StepCreationButton extends React.Component<StepCreationButtonProps> {
  constructor (props) {
    super(props)
    this.handleAllClicks = this.handleAllClicks.bind(this)
  }

  handleAllClicks (e) {
    if (this.ref && !this.ref.contains(e.target)) {
      this.props.onClickAway(e)
    }
  }

  componentDidMount () {
    document.addEventListener('click', this.handleAllClicks, true)
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.handleAllClicks, true)
  }

  render () {
    const {expanded, onExpandClick, onStepClick} = this.props
    return (
      <div ref={ref => { this.ref = ref }}>{expanded
        ? <React.Fragment>
          <PrimaryButton
            onClick={onStepClick('transfer')}
            iconName='arrow right'
            >
              Transfer
          </PrimaryButton>
          <PrimaryButton
            onClick={onStepClick('distribute')}
            iconName='distribute'
            >Distribute
          </PrimaryButton>
        </React.Fragment>
          : <PrimaryButton onClick={onExpandClick}>+ Add Action</PrimaryButton>
        }</div>
    )
  }
}

function mapStateToProps (state) {
  return ({
    expanded: selectors.stepCreationButtonExpanded(state)
  })
}

function mapDispatchToProps (dispatch) {
  return {
    onStepClick: stepType => e => dispatch(addStep({type: stepType, collapsed: false})),
    onExpandClick: e => dispatch(expandAddStepButton(true)),
    onClickAway: e => dispatch(expandAddStepButton(false))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepCreationButton)
