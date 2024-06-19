import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { RECOVERY_MAP } from '../constants'
import {
  ReplaceTips,
  SelectTips,
  TwoColTextAndFailedStepNextStep,
} from '../shared'

import type { RecoveryContentProps } from '../types'

export function RetryNewTips(props: RecoveryContentProps): JSX.Element | null {
  const { recoveryMap, routeUpdateActions } = props
  const { step } = recoveryMap
  const { RETRY_NEW_TIPS, DROP_TIP_FLOWS } = RECOVERY_MAP

  // Do this instead of directly routing to DropTipFlows route first,
  // so SelectRecoveryOptions labels this route as the selected recovery option.
  if (step === RETRY_NEW_TIPS.STEPS.DROP_TIPS) {
    void routeUpdateActions.proceedToRouteAndStep(
      DROP_TIP_FLOWS.ROUTE,
      DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING
    )
  }

  const buildContent = (): JSX.Element | null => {
    switch (step) {
      case RETRY_NEW_TIPS.STEPS.REPLACE_TIPS:
        return <ReplaceTips {...props} />
      case RETRY_NEW_TIPS.STEPS.SELECT_TIPS:
        return <SelectTips {...props} />
      case RETRY_NEW_TIPS.STEPS.RETRY:
        return <RetryWithNewTips {...props} />
      default:
        return <ReplaceTips {...props} />
    }
  }

  return buildContent()
}

export function RetryWithNewTips(
  props: RecoveryContentProps
): JSX.Element | null {
  const { recoveryCommands, routeUpdateActions } = props
  const { retryFailedCommand, resumeRun } = recoveryCommands
  const { setRobotInMotion } = routeUpdateActions
  const { ROBOT_RETRYING_STEP } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')

  const primaryBtnOnClick = (): Promise<void> => {
    return setRobotInMotion(true, ROBOT_RETRYING_STEP.ROUTE)
      .then(() => retryFailedCommand())
      .then(() => {
        resumeRun()
      })
  }

  const buildBodyText = (): JSX.Element => {
    return (
      <Trans
        t={t}
        i18nKey="robot_will_retry_with_new_tips"
        components={{
          block: <StyledText as="p" />,
        }}
      />
    )
  }

  return (
    <TwoColTextAndFailedStepNextStep
      {...props}
      leftColTitle={t('retry_with_new_tips')}
      leftColBodyText={buildBodyText()}
      primaryBtnCopy={t('retry_now')}
      primaryBtnOnClick={primaryBtnOnClick}
    />
  )
}
