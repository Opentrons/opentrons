import React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useAtom } from 'jotai'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { PromptGuide } from '../../molecules/PromptGuide'
import { InputPrompt } from '../../molecules/InputPrompt'
import { ChatDisplay } from '../../molecules/ChatDisplay'
import { chatDataAtom } from '../../resources/atoms'

export function ChatContainer(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const [chatData] = useAtom(chatDataAtom)

  return (
    <Flex
      padding={`${SPACING.spacing40} ${SPACING.spacing40} ${SPACING.spacing24}`}
      backgroundColor={COLORS.grey10}
      width="100%"
      id="ChatContainer"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing40}
    >
      {/* This will be updated when input textbox and function are implemented */}

      <Flex width="100%" height="100%" overflow="auto">
        <ChatDataContainer>
          <StyledText>{t('opentronsai')}</StyledText>
          {/* Prompt Guide remain as a reference for users. */}
          <PromptGuide />
          {chatData.length > 0
            ? chatData.map((chat, index) => (
                <ChatDisplay
                  key={`prompt-from_${chat.role}_${index}`}
                  chat={chat}
                  chatId={`${chat.role}_${index}`}
                />
              ))
            : null}
        </ChatDataContainer>
      </Flex>
      <Flex
        bottom="0"
        width="100%"
        gridGap={SPACING.spacing24}
        flexDirection={DIRECTION_COLUMN}
      >
        <InputPrompt />
        <StyledText css={DISCLAIMER_TEXT_STYLE}>{t('disclaimer')}</StyledText>
      </Flex>
    </Flex>
  )
}

const ChatDataContainer = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing12};
  width: 100%;
`

const DISCLAIMER_TEXT_STYLE = css`
  color: ${COLORS.grey55};
  font-size: ${TYPOGRAPHY.fontSize20};
  line-height: ${TYPOGRAPHY.lineHeight24};
  text-align: ${TYPOGRAPHY.textAlignCenter};
`
