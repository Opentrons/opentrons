import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { LegacyStyledText } from '@opentrons/components'

import { RECOVERY_MAP } from '../constants'
import {
  ReplaceTips,
  SelectTips,
  TwoColTextAndFailedStepNextStep,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps } from '../types'

export function SkipStepNewTips(
  props: RecoveryContentProps
): JSX.Element | null {
  const { recoveryMap, routeUpdateActions } = props
  const { step, route } = recoveryMap
  const { SKIP_STEP_WITH_NEW_TIPS, DROP_TIP_FLOWS } = RECOVERY_MAP

  // Do this instead of directly routing to DropTipFlows route first,
  // so SelectRecoveryOptions labels this route as the selected recovery option.
  if (step === SKIP_STEP_WITH_NEW_TIPS.STEPS.DROP_TIPS) {
    void routeUpdateActions.proceedToRouteAndStep(
      DROP_TIP_FLOWS.ROUTE,
      DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING
    )
  }

  const buildContent = (): JSX.Element => {
    switch (step) {
      case SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS:
        return <ReplaceTips {...props} />
      case SKIP_STEP_WITH_NEW_TIPS.STEPS.SELECT_TIPS:
        return <SelectTips {...props} />
      case SKIP_STEP_WITH_NEW_TIPS.STEPS.SKIP:
        return <SkipStepWithNewTips {...props} />
      default:
        console.warn(`${step} in ${route} not explicitly handled. Rerouting.`)
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}

export function SkipStepWithNewTips(props: RecoveryContentProps): JSX.Element {
  const { recoveryCommands, routeUpdateActions } = props
  const { skipFailedCommand } = recoveryCommands
  const { setRobotInMotion } = routeUpdateActions
  const { ROBOT_SKIPPING_STEP } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')

  const primaryBtnOnClick = (): Promise<void> => {
    return setRobotInMotion(true, ROBOT_SKIPPING_STEP.ROUTE).then(() => {
      skipFailedCommand()
    })
  }

  const buildBodyText = (): JSX.Element => {
    return (
      <Trans
        t={t}
        i18nKey="failed_dispense_step_not_completed"
        components={{
          block: <LegacyStyledText as="p" />,
        }}
      />
    )
  }

  return (
    <TwoColTextAndFailedStepNextStep
      {...props}
      leftColTitle={t('skip_to_next_step_new_tips')}
      leftColBodyText={buildBodyText()}
      primaryBtnOnClick={primaryBtnOnClick}
      primaryBtnCopy={t('continue_run_now')}
    />
  )
}
