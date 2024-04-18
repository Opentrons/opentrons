import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { PromptGuide } from '../../molecules/PromptGuide'
import { InputPrompt } from '../../molecules/InputPrompt'

export function ChatContainer(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const isDummyInitial = true
  return (
    <Flex
      padding={SPACING.spacing40}
      backgroundColor={COLORS.grey10}
      width="100%"
    >
      {/* This will be updated when input textbox and function are implemented */}
      {isDummyInitial ? (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          position={POSITION_RELATIVE}
          width="100%"
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing12}
            width="100%"
          >
            <StyledText>{t('opentronsai')}</StyledText>
            <PromptGuide />
          </Flex>
          <Flex position={POSITION_ABSOLUTE} bottom="0" width="100%">
            <InputPrompt />
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}
