import * as React from 'react'

import { useTranslation } from 'react-i18next'

import { Flex, DISPLAY_INLINE, StyledText } from '@opentrons/components'

import { CommandText } from '../../../molecules/Command'

import type { StyleProps } from '@opentrons/components'
import type { RecoveryContentProps } from '../types'

interface StepInfoProps extends StyleProps {
  textStyle: React.ComponentProps<typeof StyledText>[
    | 'desktopStyle'
    | 'oddStyle']
  stepCounts: RecoveryContentProps['stepCounts']
  failedCommand: RecoveryContentProps['failedCommand']
  robotType: RecoveryContentProps['robotType']
  protocolAnalysis: RecoveryContentProps['protocolAnalysis']
}

export function StepInfo({
  textStyle,
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
      <StyledText as={textStyle} display={DISPLAY_INLINE}>
        {`${t('at_step')} ${currentCopy}/${totalCopy}: `}
      </StyledText>
      {analysisCommand != null && protocolAnalysis != null ? (
        <CommandText
          command={analysisCommand}
          commandTextData={protocolAnalysis}
          robotType={robotType}
          display={DISPLAY_INLINE}
          as={textStyle}
        />
      ) : null}
    </Flex>
  )
}
