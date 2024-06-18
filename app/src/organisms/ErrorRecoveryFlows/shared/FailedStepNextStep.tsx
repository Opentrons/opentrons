import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { Command } from '../../../molecules/Command'

import type { RecoveryContentProps } from '../types'

export function FailedStepNextStep({
  protocolAnalysis,
  failedCommand,
  isOnDevice,
  robotType,
  commandAfterFailedCommand,
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')

  if (isOnDevice) {
    return (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <StyledText as="pSemiBold">{t('failed_step')}</StyledText>
          {failedCommand != null && protocolAnalysis != null ? (
            <Command
              state="failed"
              command={failedCommand}
              commandTextData={protocolAnalysis}
              robotType={robotType}
              aligned="left"
            />
          ) : null}
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <StyledText as="pSemiBold">{t('next_step')}</StyledText>
          {commandAfterFailedCommand != null && protocolAnalysis != null ? (
            <Command
              state="future"
              command={commandAfterFailedCommand}
              commandTextData={protocolAnalysis}
              robotType={robotType}
              aligned="left"
            />
          ) : null}
        </Flex>
      </Flex>
    )
  } else {
    return null
  }
}
