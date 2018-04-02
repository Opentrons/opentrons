// @flow
import * as React from 'react'
import styles from './StepCreationButton.css'

import {PrimaryButton} from '@opentrons/components'
import {stepIconsByType} from '../steplist/types'
import type {StepType} from '../steplist/types'

type StepCreationButtonProps = {
  onStepClick?: StepType => (event?: SyntheticEvent<*>) => mixed,
  onExpandClick?: (event?: SyntheticEvent<*>) => mixed,
  onClickAway?: (event?: MouseEvent | SyntheticEvent<*>) => mixed, // TODO is there away around this 2-event union?
  expanded?: boolean
}

class StepCreationButton extends React.Component<StepCreationButtonProps> {
  ref: ?HTMLDivElement
  handleAllClicks = (e: MouseEvent) => {
    // TODO Ian 2018-03-23 this isn't working correctly now,
    // but should onMouseLeave take care of this behavior instead, anyway?
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
      <div className={styles.step_creation_button} ref={ref => { this.ref = ref }} onMouseLeave={onClickAway}>
        <PrimaryButton onClick={expanded ? onClickAway : onExpandClick}>+ Add Step</PrimaryButton>
        <div className={styles.buttons_popover}>
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
      </div>
    )
  }
}

export default StepCreationButton
