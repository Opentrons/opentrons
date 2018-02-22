// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import {PrimaryButton} from '@opentrons/components'
import {addStep, expandAddStepButton} from '../steplist/actions'
import {selectors} from '../steplist/reducers'
import {stepIconsByType} from '../steplist/types'
import type {StepType} from '../steplist/types'
import type {BaseState} from '../types'

type StepCreationButtonProps = {
  onStepClick?: StepType => (event?: SyntheticEvent<*>) => void,
  onExpandClick?: (event?: SyntheticEvent<*>) => void,
  onClickAway?: (event?: Event | SyntheticEvent<*>) => void, // TODO is there away around this 2-event union?
  expanded?: boolean
}

class StepCreationButton extends React.Component<StepCreationButtonProps> {
  ref: ?HTMLDivElement
  handleAllClicks = (e: Event) => {
    if (this.ref && (e.currentTarget instanceof HTMLElement) && !this.ref.contains(e.currentTarget)) {
      this.props.expanded && this.props.onClickAway && this.props.onClickAway(e)
    }
  }

  componentDidMount () {
    document.addEventListener('click', this.handleAllClicks, true)
  }

  componentWillUnmount () {
    document.removeEventListener('click', this.handleAllClicks, true)
  }

  render () {
    const {expanded, onExpandClick, onStepClick, onClickAway} = this.props
    const supportedSteps = ['transfer', 'distribute', 'consolidate', 'mix', 'pause']

    return (
      <div ref={ref => { this.ref = ref }}>
        <PrimaryButton onClick={expanded ? onClickAway : onExpandClick}>+ Add Step</PrimaryButton>
        {expanded && supportedSteps.map(stepType =>
          <PrimaryButton
            key={stepType}
            onClick={onStepClick && onStepClick(stepType)}
            iconName={stepIconsByType[stepType]}
          >
            {stepType}
          </PrimaryButton>
        )}
      </div>
    )
  }
}

function mapStateToProps (state: BaseState) {
  return ({
    expanded: selectors.stepCreationButtonExpanded(state)
  })
}

function mapDispatchToProps (dispatch) {
  return {
    onStepClick: stepType => () => dispatch(addStep({stepType})),
    onExpandClick: () => dispatch(expandAddStepButton(true)),
    onClickAway: () => dispatch(expandAddStepButton(false))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(StepCreationButton)
