// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import { HoverTooltip, PrimaryButton } from '@opentrons/components'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { i18n } from '../localization'
import { actions as stepsActions } from '../ui/steps'
import {
  selectors as stepFormSelectors,
  getIsModuleOnDeck,
} from '../step-forms'
import { stepIconsByType, type StepType } from '../form-types'
import type { BaseState, ThunkDispatch } from '../types'
import styles from './listButtons.css'

type SP = {|
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

class StepCreationButtonComponent extends React.Component<Props, State> {
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
            supportedSteps.map(stepType => {
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
    isStepTypeEnabled: {
      moveLiquid: true,
      mix: true,
      pause: true,
      magnet: getIsModuleOnDeck(modules, MAGNETIC_MODULE_TYPE),
      temperature:
        getIsModuleOnDeck(modules, TEMPERATURE_MODULE_TYPE) ||
        getIsModuleOnDeck(modules, THERMOCYCLER_MODULE_TYPE),
      thermocycler: getIsModuleOnDeck(modules, THERMOCYCLER_MODULE_TYPE),
    },
  }
}

const mapDTP = (dispatch: ThunkDispatch<*>): DP => ({
  makeAddStep: (stepType: StepType) => (e: SyntheticEvent<>) =>
    dispatch(stepsActions.addAndSelectStepWithHints({ stepType })),
})

export const StepCreationButton = connect<Props, {||}, SP, DP, _, _>(
  mapSTP,
  mapDTP
)(StepCreationButtonComponent)
