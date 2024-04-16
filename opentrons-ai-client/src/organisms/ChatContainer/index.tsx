import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { PromptGuide } from '../../molecules/PromptGuide'

export function ChatContainer(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const isDummyInitial = true
  return (
    <Flex padding={SPACING.spacing40} backgroundColor={COLORS.grey10}>
      {/* This will be updated when input textbox and function are implemented */}
      {isDummyInitial ? (
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
          <StyledText>{t('opentronsai')}</StyledText>
          <PromptGuide />
        </Flex>
      ) : null}
    </Flex>
  )
}
