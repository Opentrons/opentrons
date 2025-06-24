import { useEffect, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAtom } from 'jotai'
import styled from 'styled-components'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { ChatDisplay } from '../../molecules/ChatDisplay'
import { ChatFooter } from '../../molecules/ChatFooter'
import { FeedbackModal } from '../../molecules/FeedbackModal'
import {
  chatDataAtom,
  createProtocolChatAtom,
  feedbackModalAtom,
  scrollToBottomAtom,
  updateProtocolChatAtom,
} from '../../resources/atoms'

export interface InputType {
  userPrompt: string
}

export function Chat(): JSX.Element | null {
  const { t } = useTranslation('protocol_generator')
  const methods = useForm<InputType>({
    defaultValues: {
      userPrompt: '',
    },
  })

  const [chatData] = useAtom(chatDataAtom)
  const scrollRef = useRef<HTMLSpanElement | null>(null)
  const [showFeedbackModal] = useAtom(feedbackModalAtom)
  const [scrollToBottom] = useAtom(scrollToBottomAtom)
  const navigate = useNavigate()
  const [updateProtocolChat] = useAtom(updateProtocolChatAtom)
  const [createProtocolChat] = useAtom(createProtocolChatAtom)
  const isDirectChatAccess =
    updateProtocolChat.update_details === 'direct_chat_access'

  // Redirect to home page if there is no prompt (user has refreshed the page)
  // Exception: Allow direct chat access
  useEffect(() => {
    if (
      updateProtocolChat.prompt === '' &&
      createProtocolChat.prompt === '' &&
      !isDirectChatAccess
    ) {
      navigate('/')
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current != null)
      scrollRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      })
  }, [chatData.length, scrollToBottom])

  return (
    <FormProvider {...methods}>
      <Flex
        padding={`${SPACING.spacing40} ${SPACING.spacing40} ${SPACING.spacing20}`}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing12}
        width="100%"
      >
        <Flex
          width="100%"
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing24}
        >
          <ChatDataContainer>
            {isDirectChatAccess && (
              <ChatDisplay
                chat={{
                  role: 'assistant',
                  reply: t('chat_welcome_message'),
                  requestId: 'welcome-message',
                }}
                chatId="welcome-message"
              />
            )}
            {chatData.map((chat, index) => (
              <ChatDisplay
                key={`prompt-from_${chat.role}_${index}`}
                chat={chat}
                chatId={`${chat.role}_${index}`}
              />
            ))}
          </ChatDataContainer>
        </Flex>
        <ChatFooter />
        <span ref={scrollRef} />
        {showFeedbackModal ? <FeedbackModal /> : null}
      </Flex>
    </FormProvider>
  )
}

const ChatDataContainer = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  width: 100%;
`
