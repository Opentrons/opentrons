import * as React from 'react'

import type { RecoveryContentProps } from '../types'
import { TwoColTextAndFailedStepNextStep } from '../shared'
import { RECOVERY_MAP } from '../constants'
import { Trans, useTranslation } from 'react-i18next'
import { StyledText } from '@opentrons/components'

export function RetrySameTips(props: RecoveryContentProps): JSX.Element {
  const { routeUpdateActions, recoveryCommands } = props
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
        i18nKey="robot_will_retry_with_same_tips"
        components={{
          block: <StyledText as="p" />,
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
