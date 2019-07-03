// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import { HoverTooltip, PrimaryButton, Icon } from '@opentrons/components'
import i18n from '../localization'
import { actions as steplistActions } from '../steplist'
import { stepIconsByType, type StepType } from '../form-types'
import type { ThunkDispatch } from '../types'
import styles from './listButtons.css'

type Props = { makeAddStep: StepType => (SyntheticEvent<>) => mixed }

type State = { expanded?: boolean }

type DP = $Exact<Props>

class StepCreationButton extends React.Component<Props, State> {
  state = { expanded: true }

  handleExpandClick = (e: SyntheticEvent<>) => {
    this.setState({ expanded: !this.state.expanded })
  }

  handleMouseLeave = (e: SyntheticEvent<>) => {
    // this.setState({ expanded: false })
  }

  render() {
    // TODO: Ian 2019-01-17 move out to centralized step info file - see #2926
    const supportedSteps = ['moveLiquid', 'mix', 'pause']

    return (
      <>
        <div
          className={styles.list_item_button_wrapper}
          onMouseLeave={this.handleMouseLeave}
        >
          <PrimaryButton
            onClick={this.handleExpandClick}
            className={cx(styles.list_item_button, {
              [styles.active]: this.state.expanded,
            })}
          >
            <div className={styles.step_creation_icon_wrapper}>
              <Icon name="plus" className={styles.step_creation_icon} />
            </div>
            {i18n.t('button.add_step')}
          </PrimaryButton>
        </div>
        <div className={styles.buttons_popover}>
          {this.state.expanded &&
            supportedSteps.map(stepType => (
              <HoverTooltip
                key={stepType}
                placement="right"
                modifiers={{ preventOverflow: { enabled: false } }}
                positionFixed
                tooltipComponent={i18n.t(
                  `tooltip.step_description.${stepType}`
                )}
              >
                {hoverTooltipHandlers => (
                  <PrimaryButton
                    hoverTooltipHandlers={hoverTooltipHandlers}
                    onClick={this.props.makeAddStep(stepType)}
                    className={styles.step_creation_option}
                  >
                    <div className={styles.step_creation_icon_wrapper}>
                      <Icon
                        name={stepIconsByType[stepType]}
                        className={styles.step_creation_icon}
                      />
                    </div>
                    {i18n.t(`application.stepType.${stepType}`, stepType)}
                  </PrimaryButton>
                )}
              </HoverTooltip>
            ))}
        </div>
      </>
    )
  }
}

const mapDTP = (dispatch: ThunkDispatch<*>): DP => ({
  makeAddStep: (stepType: StepType) => (e: SyntheticEvent<>) =>
    dispatch(steplistActions.addStep({ stepType })),
})

export default connect<Props, {||}, {||}, DP, _, _>(
  null,
  mapDTP
)(StepCreationButton)
