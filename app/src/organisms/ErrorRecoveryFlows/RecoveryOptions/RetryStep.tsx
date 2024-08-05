import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { RECOVERY_MAP } from '../constants'
import { RecoveryFooterButtons, RecoverySingleColumnContent } from '../shared'

import type { RecoveryContentProps } from '../types'

export function RetryStep({
  isOnDevice,
  routeUpdateActions,
  recoveryCommands,
}: RecoveryContentProps): JSX.Element | null {
  const { ROBOT_RETRYING_STEP } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')

  const { retryFailedCommand, resumeRun } = recoveryCommands
  const { goBackPrevStep, setRobotInMotion } = routeUpdateActions

  const primaryBtnOnClick = (): Promise<void> => {
    return setRobotInMotion(true, ROBOT_RETRYING_STEP.ROUTE)
      .then(() => retryFailedCommand())
      .then(() => {
        resumeRun()
      })
  }

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent
        gridGap={SPACING.spacing24}
        alignItems={ALIGN_CENTER}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing24}
          height="100%"
          width="848px"
        >
          <Icon name="ot-alert" size="3.75rem" marginTop={SPACING.spacing24} />
          <StyledText as="h3Bold">
            {t('are_you_sure_you_want_to_resume')}
          </StyledText>
          <StyledText as="h4" textAlign={ALIGN_CENTER}>
            {t('run_will_resume')}
          </StyledText>
        </Flex>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={primaryBtnOnClick}
          secondaryBtnOnClick={goBackPrevStep}
          primaryBtnTextOverride={t('confirm')}
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}
