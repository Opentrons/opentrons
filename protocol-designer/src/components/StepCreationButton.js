// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {HoverTooltip, PrimaryButton} from '@opentrons/components'

import i18n from '../localization'
import {actions as steplistActions} from '../steplist'
import {stepIconsByType, type StepType} from '../form-types'
import type {ThunkDispatch} from '../types'
import styles from './listButtons.css'

type DP = {makeAddStep: (StepType) => (SyntheticEvent<>) => mixed}

type State = {expanded?: boolean}

class StepCreationButton extends React.Component<DP, State> {
  state = {expanded: false}

  handleExpandClick = (e: SyntheticEvent<>) => {
    this.setState({expanded: !this.state.expanded})
  }

  handleMouseLeave = (e: SyntheticEvent<>) => {
    this.setState({expanded: false})
  }

  render () {
    const supportedSteps = ['transfer', 'distribute', 'consolidate', 'mix', 'pause']

    return (
      <div className={styles.list_item_button} onMouseLeave={this.handleMouseLeave}>
        <PrimaryButton onClick={this.handleExpandClick}>
          {i18n.t('button.add_step')}
        </PrimaryButton>

        <div className={styles.buttons_popover}>
          {
            this.state.expanded && supportedSteps.map(stepType => (
              <HoverTooltip
                key={stepType}
                placement='right'
                modifiers={{preventOverflow: {enabled: false}}}
                positionFixed
                tooltipComponent={i18n.t(`tooltip.step_description.${stepType}`)}>
                {(hoverTooltipHandlers) => (
                  <PrimaryButton
                    hoverTooltipHandlers={hoverTooltipHandlers}
                    onClick={this.props.makeAddStep(stepType)}
                    iconName={stepIconsByType[stepType]}>
                    {stepType}
                  </PrimaryButton>
                )}
              </HoverTooltip>
            ))
          }
        </div>
      </div>
    )
  }
}

const mapDTP = (dispatch: ThunkDispatch<*>) => ({
  makeAddStep: (stepType: StepType) => (e: SyntheticEvent<>) => dispatch(steplistActions.addStep({stepType})),
})

export default connect(null, mapDTP)(StepCreationButton)
