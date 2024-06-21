import * as React from 'react'

import { useTranslation } from 'react-i18next'

import { Flex, LegacyStyledText, DISPLAY_INLINE } from '@opentrons/components'

import { CommandText } from '../../../molecules/Command'

import type { StyleProps } from '@opentrons/components'
import type { RecoveryContentProps } from '../types'

interface StepInfoProps extends StyleProps {
  as: React.ComponentProps<typeof LegacyStyledText>['as']
  stepCounts: RecoveryContentProps['stepCounts']
  failedCommand: RecoveryContentProps['failedCommand']
  robotType: RecoveryContentProps['robotType']
  protocolAnalysis: RecoveryContentProps['protocolAnalysis']
}

export function StepInfo({
  as,
  stepCounts,
  failedCommand,
  robotType,
  protocolAnalysis,
  ...styleProps
}: StepInfoProps): JSX.Element {
  const { t } = useTranslation('error_recovery')
  const { currentStepNumber, totalStepCount } = stepCounts

  const analysisCommand = protocolAnalysis?.commands.find(
    command => command.key === failedCommand?.key
  )

  const currentCopy = currentStepNumber ?? '?'
  const totalCopy = totalStepCount ?? '?'

  return (
    <Flex display={DISPLAY_INLINE} {...styleProps}>
      <LegacyStyledText as={as} display={DISPLAY_INLINE}>
        {`${t('at_step')} ${currentCopy}/${totalCopy}: `}
      </LegacyStyledText>
      {analysisCommand != null && protocolAnalysis != null ? (
        <CommandText
          command={analysisCommand}
          commandTextData={protocolAnalysis}
          robotType={robotType}
          display={DISPLAY_INLINE}
          as={as}
        />
      ) : null}
    </Flex>
  )
}
