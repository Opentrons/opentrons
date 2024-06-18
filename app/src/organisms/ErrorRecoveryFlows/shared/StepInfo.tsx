import * as React from 'react'

import { useTranslation } from 'react-i18next'

import { Flex, StyledText, DISPLAY_INLINE } from '@opentrons/components'

import { CommandText } from '../../../molecules/Command'

import type { StyleProps } from '@opentrons/components'
import type { RecoveryContentProps } from '../types'

interface StepInfoProps extends StyleProps {
  as: React.ComponentProps<typeof StyledText>['as']
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

  // TODO(jh 06-17-24): Once design decides what to do with CommandText, update it here.
  return (
    <Flex display={DISPLAY_INLINE} {...styleProps}>
      <StyledText as={as} display={DISPLAY_INLINE}>
        {`${t('at_step')} ${currentCopy}/${totalCopy}: `}
      </StyledText>
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
