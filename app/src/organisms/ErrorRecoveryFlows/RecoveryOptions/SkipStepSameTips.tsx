import * as React from 'react'

import type { RecoveryContentProps } from '../types'
import { TwoColTextAndFailedStepNextStep } from '../shared'
import { RECOVERY_MAP } from '../constants'
import { Trans, useTranslation } from 'react-i18next'
import { StyledText } from '@opentrons/components'

export function SkipStepSameTips(props: RecoveryContentProps): JSX.Element {
  const { routeUpdateActions, recoveryCommands } = props
  const { skipFailedCommand, resumeRun } = recoveryCommands
  const { setRobotInMotion } = routeUpdateActions
  const { ROBOT_SKIPPING_STEP } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')

  const primaryBtnOnClick = (): Promise<void> => {
    return setRobotInMotion(true, ROBOT_SKIPPING_STEP.ROUTE)
      .then(() => skipFailedCommand())
      .then(() => {
        resumeRun()
      })
  }

  const buildBodyText = (): JSX.Element => {
    return (
      <Trans
        t={t}
        i18nKey="failed_dispense_step_not_completed"
        components={{
          block: <StyledText as="p" />,
        }}
      />
    )
  }

  return (
    <TwoColTextAndFailedStepNextStep
      {...props}
      leftColTitle={t('skip_to_next_step_same_tips')}
      leftColBodyText={buildBodyText()}
      primaryBtnOnClick={primaryBtnOnClick}
      primaryBtnCopy={t('continue_run_now')}
    />
  )
}
