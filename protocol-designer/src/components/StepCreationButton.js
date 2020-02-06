// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import without from 'lodash/without'
import { HoverTooltip, PrimaryButton } from '@opentrons/components'
import i18n from '../localization'
import { actions as stepsActions } from '../ui/steps'
import { selectors as featureFlagSelectors } from '../feature-flags'
import {
  selectors as stepFormSelectors,
  getIsModuleOnDeck,
} from '../step-forms'
import { stepIconsByType, type StepType } from '../form-types'
import type { BaseState, ThunkDispatch } from '../types'
import { MAGDECK, TEMPDECK, THERMOCYCLER } from '../constants'
import styles from './listButtons.css'

type SP = {|
  modulesEnabled: ?boolean,
  isStepTypeEnabled: {
    [moduleType: StepType]: boolean,
  },
|}

type DP = {|
  makeAddStep: StepType => (SyntheticEvent<>) => mixed,
|}

type Props = {|
  ...SP,
  ...DP,
|}

type State = { expanded?: boolean }

class StepCreationButton extends React.Component<Props, State> {
  state = { expanded: false }

  handleExpandClick = (e: SyntheticEvent<>) => {
    this.setState({ expanded: !this.state.expanded })
  }

  handleMouseLeave = (e: SyntheticEvent<>) => {
    this.setState({ expanded: false })
  }

  render() {
    // TODO: Ian 2019-01-17 move out to centralized step info file - see #2926
    const supportedSteps = [
      'moveLiquid',
      'mix',
      'pause',
      'magnet',
      'temperature',
      'thermocycler',
    ]
    const moduleSteps = ['magnet', 'temperature', 'thermocycler']
    const filteredSteps = this.props.modulesEnabled
      ? supportedSteps
      : without(supportedSteps, ...moduleSteps)
    const { isStepTypeEnabled } = this.props

    return (
      <div
        className={styles.list_item_button}
        onMouseLeave={this.handleMouseLeave}
      >
        <PrimaryButton onClick={this.handleExpandClick}>
          {i18n.t('button.add_step')}
        </PrimaryButton>

        <div className={styles.buttons_popover}>
          {this.state.expanded &&
            filteredSteps.map(stepType => {
              const disabled = !isStepTypeEnabled[stepType]
              const tooltipMessage = disabled
                ? i18n.t(`tooltip.disabled_module_step`)
                : i18n.t(`tooltip.step_description.${stepType}`)
              const onClick = !disabled
                ? this.props.makeAddStep(stepType)
                : () => null
              return (
                <HoverTooltip
                  key={stepType}
                  placement="right"
                  modifiers={{ preventOverflow: { enabled: false } }}
                  positionFixed
                  tooltipComponent={tooltipMessage}
                >
                  {hoverTooltipHandlers => (
                    <PrimaryButton
                      hoverTooltipHandlers={hoverTooltipHandlers}
                      onClick={onClick}
                      iconName={stepIconsByType[stepType]}
                      className={cx({
                        [styles.step_button_disabled]: disabled,
                      })}
                    >
                      {i18n.t(`application.stepType.${stepType}`, stepType)}
                    </PrimaryButton>
                  )}
                </HoverTooltip>
              )
            })}
        </div>
      </div>
    )
  }
}

const mapSTP = (state: BaseState): SP => {
  const modules = stepFormSelectors.getInitialDeckSetup(state).modules
  return {
    modulesEnabled: featureFlagSelectors.getEnableModules(state),
    isStepTypeEnabled: {
      moveLiquid: true,
      mix: true,
      pause: true,
      magnet: getIsModuleOnDeck(modules, MAGDECK),
      temperature:
        getIsModuleOnDeck(modules, TEMPDECK) ||
        getIsModuleOnDeck(modules, THERMOCYCLER),
      thermocycler: getIsModuleOnDeck(modules, THERMOCYCLER),
    },
  }
}

const mapDTP = (dispatch: ThunkDispatch<*>): DP => ({
  makeAddStep: (stepType: StepType) => (e: SyntheticEvent<>) =>
    dispatch(stepsActions.addStep({ stepType })),
})

export default connect<Props, {||}, SP, DP, _, _>(
  mapSTP,
  mapDTP
)(StepCreationButton)
