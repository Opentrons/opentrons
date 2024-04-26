import React from 'react'
import { useTranslation } from 'react-i18next'
import Markdown from 'react-markdown'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import type { ChatData } from '../../resources/types'

interface ChatDisplayProps {
  chat: ChatData
}

export function ChatDisplay({ chat }: ChatDisplayProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const { role, content } = chat
  const isUser = role === 'user'
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      paddingLeft={isUser ? SPACING.spacing40 : undefined}
      paddingRight={isUser ? undefined : SPACING.spacing40}
    >
      <StyledText>{isUser ? t('you') : t('opentronsai')}</StyledText>
      {/* text should be markdown so this component will have a package or function to parse markdown */}
      <Flex
        padding={SPACING.spacing32}
        backgroundColor={isUser ? COLORS.blue30 : COLORS.grey30}
        data-testid={`ChatDisplay_from_${isUser ? 'user' : 'backend'}`}
        borderRadius={BORDERS.borderRadius12}
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
      >
        {/* ToDo (kk:04/19/2024) I will get feedback for additional styling  from the design team. */}
        <Markdown>{content}</Markdown>
      </Flex>
    </Flex>
  )
}
