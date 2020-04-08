// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import cx from 'classnames'
import {
  Tooltip,
  PrimaryButton,
  useHoverTooltip,
  TOOLTIP_RIGHT,
  TOOLTIP_FIXED,
} from '@opentrons/components'

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

function StepCreationButtonComponent(props: Props) {
  const [expanded, setExpanded] = React.useState(false)

  // TODO: Ian 2019-01-17 move out to centralized step info file - see #2926
  const supportedSteps = [
    'moveLiquid',
    'mix',
    'pause',
    'magnet',
    'temperature',
    'thermocycler',
  ]
  const { isStepTypeEnabled } = props

  return (
    <div
      className={styles.list_item_button}
      onMouseLeave={() => setExpanded(false)}
    >
      <PrimaryButton onClick={() => setExpanded(true)}>
        {i18n.t('button.add_step')}
      </PrimaryButton>

      <div className={styles.buttons_popover}>
        {expanded &&
          supportedSteps.map(stepType => {
            const disabled = !isStepTypeEnabled[stepType]
            const onClick = !disabled ? props.makeAddStep(stepType) : () => null

            const buttonProps = {
              disabled: disabled,
              onClick: () => onClick,
              stepType: stepType,
            }
            return <StepButtonItem {...buttonProps} key={stepType} />
          })}
      </div>
    </div>
  )
}

type ItemProps = {
  onClick: () => mixed,
  disabled: boolean,
  stepType: string,
}

function StepButtonItem(props: ItemProps) {
  const { onClick, disabled, stepType } = props
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_RIGHT,
    strategy: TOOLTIP_FIXED,
  })
  const tooltipMessage = disabled
    ? i18n.t(`tooltip.disabled_module_step`)
    : i18n.t(`tooltip.step_description.${stepType}`)
  return (
    <>
      <PrimaryButton
        hoverTooltipHandlers={targetProps}
        onClick={onClick}
        iconName={stepIconsByType[stepType]}
        className={cx({
          [styles.step_button_disabled]: disabled,
        })}
      >
        {i18n.t(`application.stepType.${stepType}`, stepType)}
      </PrimaryButton>
      <Tooltip key={stepType} {...tooltipProps}>
        {tooltipMessage}
      </Tooltip>
    </>
  )
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
