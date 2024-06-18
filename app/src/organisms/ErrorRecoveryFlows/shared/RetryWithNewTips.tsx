import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { RecoverySingleColumnContent } from './RecoverySingleColumnContent'
import { TwoColumn } from '../../../molecules/InterventionModal'
import { RECOVERY_MAP } from '../constants'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

import type { RecoveryContentProps } from '../types'
import { FailedStepNextStep } from './FailedStepNextStep'

export function RetryWithNewTips(
  props: RecoveryContentProps
): JSX.Element | null {
  const { isOnDevice, routeUpdateActions, recoveryCommands } = props
  const { ROBOT_RETRYING_STEP } = RECOVERY_MAP
  const { goBackPrevStep, setRobotInMotion } = routeUpdateActions
  const { retryFailedCommand, resumeRun } = recoveryCommands
  const { t } = useTranslation('error_recovery')

  const primaryBtnOnClick = (): Promise<void> => {
    return setRobotInMotion(true, ROBOT_RETRYING_STEP.ROUTE)
      .then(() => retryFailedCommand())
      .then(() => {
        resumeRun()
      })
  }

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <TwoColumn>
          <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
            <StyledText as="h4SemiBold">{t('retry_with_new_tips')}</StyledText>
            <Trans
              t={t}
              i18nKey="robot_will_retry_with_new_tips"
              components={{
                block: <StyledText as="p" />,
              }}
            />
          </Flex>
          <FailedStepNextStep {...props} />
        </TwoColumn>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={primaryBtnOnClick}
          secondaryBtnOnClick={goBackPrevStep}
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}
