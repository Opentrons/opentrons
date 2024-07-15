import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  LegacyStyledText,
  SPACING,
  ALIGN_CENTER,
  JUSTIFY_END,
} from '@opentrons/components'
import { RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR } from '@opentrons/api-client'

import { RecoveryContentWrapper, RecoveryFooterButtons } from './shared'

import type { RecoveryContentProps } from './types'

export function RecoveryDoorOpen({
  recoveryActionMutationUtils,
  runStatus,
}: RecoveryContentProps): JSX.Element {
  const {
    resumeRecovery,
    isResumeRecoveryLoading,
  } = recoveryActionMutationUtils
  const { t } = useTranslation('error_recovery')

  return (
    <RecoveryContentWrapper>
      <Flex
        padding={SPACING.spacing40}
        gridGap={SPACING.spacing24}
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        justifyContent={ALIGN_CENTER}
        flex="1"
      >
        <Icon
          name="alert-circle"
          size={SPACING.spacing60}
          color={COLORS.yellow50}
          data-testid="recovery_door_alert_icon"
        />
        <Flex
          gridGap={SPACING.spacing4}
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          textAlign={ALIGN_CENTER}
        >
          <LegacyStyledText as="h3Bold">
            {t('robot_door_is_open')}
          </LegacyStyledText>
          <LegacyStyledText as="h4">
            {t('close_the_robot_door')}
          </LegacyStyledText>
        </Flex>
      </Flex>
      <Flex justifyContent={JUSTIFY_END}>
        <RecoveryFooterButtons
          primaryBtnOnClick={resumeRecovery}
          primaryBtnTextOverride={t('resume')}
          primaryBtnDisabled={
            runStatus === RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR
          }
          isLoadingPrimaryBtnAction={isResumeRecoveryLoading}
        />
      </Flex>
    </RecoveryContentWrapper>
  )
}
