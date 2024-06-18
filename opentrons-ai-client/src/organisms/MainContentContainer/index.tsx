import React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useAtom } from 'jotai'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  OVERFLOW_AUTO,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { PromptGuide } from '../../molecules/PromptGuide'
import { ChatDisplay } from '../../molecules/ChatDisplay'
import { ChatFooter } from '../../molecules/ChatFooter'
import { chatDataAtom } from '../../resources/atoms'

export function MainContentContainer(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const [chatData] = useAtom(chatDataAtom)
  const scrollRef = React.useRef<HTMLSpanElement | null>(null)

  React.useEffect(() => {
    if (scrollRef.current != null)
      scrollRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
  }, [chatData.length])

  return (
    <Flex
      marginTop="2.5rem"
      marginLeft="24.375rem"
      padding={`${SPACING.spacing40} ${SPACING.spacing40} ${SPACING.spacing24}`}
      backgroundColor={COLORS.grey10}
      width="auto"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing40}
      height="100vh"
    >
      <Flex
        width="100%"
        overflowY={OVERFLOW_AUTO}
        flexDirection={DIRECTION_COLUMN}
        css={css`
          flex-grow: 1;
        `}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
          {/* Prompt Guide remain as a reference for users. */}
          <StyledText>{t('opentronsai')}</StyledText>
          <PromptGuide />
        </Flex>
        <ChatDataContainer>
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
        <span ref={scrollRef} />
      </Flex>
      <Flex bottom="0" zIndex="2" width="100%" flexDirection={DIRECTION_COLUMN}>
        <ChatFooter />
      </Flex>
    </Flex>
  )
}

const ChatDataContainer = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing40};
  width: 100%;
`
