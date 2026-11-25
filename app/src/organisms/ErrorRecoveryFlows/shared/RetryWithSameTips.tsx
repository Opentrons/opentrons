import { Trans, useTranslation } from 'react-i18next'

import { LegacyStyledText } from '@opentrons/components'

import { RECOVERY_MAP } from '/app/organisms/ErrorRecoveryFlows/constants'

import { TwoColTextAndFailedStepNextStep } from './TwoColTextAndFailedStepNextStep'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '/app/organisms/ErrorRecoveryFlows/types'

export function RetryWithSameTips(props: RecoveryContentProps): ReactNode {
  const { routeUpdateActions, recoveryCommands } = props
  const { retryFailedCommand, resumeRun } = recoveryCommands
  const { handleMotionRouting } = routeUpdateActions
  const { ROBOT_RETRYING_STEP } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')

  const primaryBtnOnClick = (): Promise<void> => {
    return handleMotionRouting(true, ROBOT_RETRYING_STEP.ROUTE)
      .then(() => retryFailedCommand())
      .then(() => {
        resumeRun()
      })
  }

  const buildBodyText = (): JSX.Element => {
    return (
      <Trans
        t={t}
        i18nKey="robot_will_retry_with_same_tips"
        components={{
          block: <LegacyStyledText forwardedAs="p" />,
        }}
      />
    )
  }

  return (
    <TwoColTextAndFailedStepNextStep
      {...props}
      leftColTitle={t('retry_with_same_tips')}
      leftColBodyText={buildBodyText()}
      primaryBtnOnClick={primaryBtnOnClick}
      primaryBtnCopy={t('retry_now')}
    />
  )
}
