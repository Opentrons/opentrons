import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import Markdown from 'react-markdown'
import { useAtom } from 'jotai'
import { delay } from 'lodash'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  JUSTIFY_FLEX_START,
  LegacyStyledText,
  Link,
  OVERFLOW_AUTO,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WHITE_SPACE_PRE_WRAP,
} from '@opentrons/components'

import smallLogo from '/ai-client/assets/images/opentrons_logo_small.svg'
import { AttachedFileItem } from '/ai-client/atoms/AttachedFileItem'
import {
  chatDataAtom,
  createProtocolChatAtom,
  feedbackModalAtom,
  regenerateProtocolAtom,
  scrollToBottomAtom,
  updateProtocolChatAtom,
} from '/ai-client/resources/atoms'
import { useTrackEvent } from '/ai-client/resources/hooks/useTrackEvent'

import type { ChatData } from '/ai-client/resources/types'

interface ChatDisplayProps {
  chat: ChatData
  chatId: string
}

const HoverShadow = styled(Flex)`
  alignitems: ${ALIGN_CENTER};
  justifycontent: ${JUSTIFY_CENTER};
  padding: ${SPACING.spacing8};
  transition: box-shadow 0.3s ease;
  border-radius: ${BORDERS.borderRadius8};

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    border-radius: ${BORDERS.borderRadius8};
  }
`

const StyledIcon = styled(Icon)`
  color: ${COLORS.blue50};
`

const OuterContainer = styled.div`
  background-color: ${COLORS.white};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 16px;
`

const FileContainer = styled.div`
  background-color: ${COLORS.grey20};
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  width: 100%;
`

const BadgeContainer = styled.div`
  background-color: ${COLORS.grey30};
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  width: 100%;
`

const IconWrapper = styled.div`
  width: 32px;
  height: 32px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ButtonContainer = styled(Flex)`
  flex-direction: row;
  margin-left: auto;
`

const FileName = styled.span`
  font-size: 14px;
  color: ${COLORS.black90};
`

const PD_URL = 'https://designer.opentrons.com'

export function ChatDisplay({ chat, chatId }: ChatDisplayProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const trackEvent = useTrackEvent()
  const [isCopied, setIsCopied] = useState<boolean>(false)
  const [, setRegenerateProtocol] = useAtom(regenerateProtocolAtom)
  const [createProtocolChat] = useAtom(createProtocolChatAtom)
  const [updateProtocolChat] = useAtom(updateProtocolChatAtom)
  const [, setShowFeedbackModal] = useAtom(feedbackModalAtom)
  const { setValue } = useFormContext()
  const [chatdata] = useAtom(chatDataAtom)
  const [scrollToBottom, setScrollToBottom] = useAtom(scrollToBottomAtom)

  const [showProtocolContent, setShowProtocolContent] = useState(false)
  const { role, reply, requestId, protocol_content, attachments } = chat
  const isUser = role === 'user'

  const setInputFieldToCorrespondingRequest = (): void => {
    let prompt = ''
    if (
      requestId.includes('NewProtocol') ||
      requestId.includes('UpdateProtocol')
    ) {
      setRegenerateProtocol({
        isCreateOrUpdateProtocol: true,
        regenerate: true,
      })
      if (createProtocolChat.prompt !== '') {
        prompt = createProtocolChat.prompt
      } else {
        prompt = updateProtocolChat.prompt
      }
    } else {
      setRegenerateProtocol({
        isCreateOrUpdateProtocol: false,
        regenerate: true,
      })
      prompt =
        chatdata.find(
          chat => chat.role === 'user' && chat.requestId === requestId
        )?.reply ?? ''
    }
    setScrollToBottom(!scrollToBottom)
    setValue('userPrompt', prompt)
    trackEvent({
      name: 'regenerate-protocol',
      properties: {},
    })
  }

  const handleFileDownload = (): void => {
    if (protocol_content) {
      const blob = new Blob([JSON.stringify(protocol_content, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)

      // Use a temporary anchor
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'protocol.json'
      anchor.click()

      URL.revokeObjectURL(url)
    }
    const lastCodeBlock = document.querySelector(`#${chatId}`)
    const code = lastCodeBlock?.textContent?.trim() ?? ''
    // Don't proceed if code is empty, no need to download as a python file
    if (!code) {
      return
    }
    // Make sure python protocol is valid
    const hasRunFunction = code.includes('def run(')
    const numberOfLines = code.split('\n').length
    if (!hasRunFunction || numberOfLines <= 3) {
      return
    }

    const blobParts: BlobPart[] = [code]

    const file = new File(blobParts, 'OpentronsAI.py', { type: 'text/python' })
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')

    document.body.appendChild(a)
    a.href = url
    a.download = 'OpentronsAI.py'
    a.click()
    window.URL.revokeObjectURL(url)

    trackEvent({
      name: 'download-protocol',
      properties: {},
    })
  }

  const handleClickCopy = async (): Promise<void> => {
    if (protocol_content) {
      await navigator.clipboard.writeText(JSON.stringify(protocol_content))
    } else {
      const lastCodeBlock = document.querySelector(`#${chatId}`)
      const code = lastCodeBlock?.textContent ?? ''
      await navigator.clipboard.writeText(code)
    }

    setIsCopied(true)
    trackEvent({
      name: 'copy-protocol',
      properties: {},
    })
  }

  useEffect(() => {
    if (isCopied)
      delay(() => {
        setIsCopied(false)
      }, 2000)
  }, [isCopied])

  // ToDo this nested component definition should be resolved
  // eslint-disable-next-line @eslint-react/no-nested-component-definitions
  function CodeText(props: JSX.IntrinsicAttributes): JSX.Element {
    return <CodeWrapper {...props} id={chatId} />
  }

  const protocolName =
    chatdata.findLast(chat => chat.protocol_content != null)?.protocol_content
      ?.metadata.protocolName ?? 'protocol.json'

  // ToDo this nested component definition should be resolved
  // eslint-disable-next-line @eslint-react/no-nested-component-definitions
  const ProtocolContentBadge = (props: {
    onClick: () => void
  }): JSX.Element => {
    const { onClick } = props
    return (
      <OuterContainer>
        <FileContainer onClick={onClick}>
          <BadgeContainer>
            <IconWrapper>
              <img
                src={smallLogo}
                alt="Opentrons logo"
                width="1.5rem"
                height="1.5rem"
              />
            </IconWrapper>
            <FileName>{protocolName}</FileName>
          </BadgeContainer>

          <ButtonContainer>
            <HoverShadow
              onClick={(e: Event) => {
                e.stopPropagation()
                setShowFeedbackModal(true)
              }}
            >
              <StyledIcon size={SPACING.spacing20} name="thumbs-down" />
            </HoverShadow>
            <HoverShadow
              onClick={async (e: Event) => {
                e.stopPropagation()
                await handleClickCopy()
              }}
            >
              <StyledIcon
                size={SPACING.spacing20}
                name={isCopied ? 'check' : 'content-copy'}
              />
            </HoverShadow>
            <HoverShadow
              onClick={(e: Event) => {
                e.stopPropagation()
                handleFileDownload()
              }}
            >
              <StyledIcon size={SPACING.spacing20} name="download" />
            </HoverShadow>
          </ButtonContainer>
        </FileContainer>
      </OuterContainer>
    )
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      width="100%"
    >
      <Flex justifyContent={isUser ? JUSTIFY_FLEX_END : JUSTIFY_FLEX_START}>
        <StyledText paddingTop={SPACING.spacing12}>
          {isUser ? t('you') : t('opentronsai')}
        </StyledText>
      </Flex>
      {/* text should be markdown so this component will have a package or function to parse markdown */}
      <MessageContainer
        padding="1.5rem"
        backgroundColor={isUser ? COLORS.blue30 : COLORS.grey30}
        data-testid={`ChatDisplay_from_${isUser ? 'user' : 'backend'}`}
        borderRadius={SPACING.spacing12}
        overflowY={OVERFLOW_AUTO}
        flexDirection={DIRECTION_COLUMN}
        gridGap="1.5rem"
        position={POSITION_RELATIVE}
        $isUser={isUser}
      >
        {protocol_content == null && (
          <ContentWrapper>
            <Markdown
              components={{
                div: undefined,
                ul: UnnumberedListText,
                h2: HeaderText,
                li: ListItemText,
                p: ParagraphText,
                a: isUser ? ParagraphText : ExternalLink,
                code: CodeText,
              }}
            >
              {reply}
            </Markdown>
          </ContentWrapper>
        )}

        {/* Display file attachments for user messages */}
        {isUser && attachments && attachments.length > 0 && (
          <AttachmentsContainer>
            {attachments.map((attachment, index) => (
              <AttachedFileItem
                key={`${attachment.name}-${index}`}
                file={attachment}
                showRemoveButton={false}
              />
            ))}
          </AttachmentsContainer>
        )}
        {protocol_content != null && (
          <StyledText
            fontSize={TYPOGRAPHY.fontSize20}
            lineHeight={TYPOGRAPHY.lineHeight24}
            whiteSpace={WHITE_SPACE_PRE_WRAP}
          >
            <Trans
              t={t}
              i18nKey="pd_protocol_reply"
              components={{
                a: <ExternalLink href={PD_URL} />,
              }}
            />
            <Link href={PD_URL} external>
              <StyledIcon
                name="open-in-new"
                size="1rem"
                margin={`${SPACING.spacing4} 0 0 ${SPACING.spacing4}`}
              />
            </Link>
          </StyledText>
        )}

        {/* Display protocol_content badge and content */}
        {!isUser && protocol_content && (
          <>
            <ProtocolContentBadge
              onClick={() => {
                setShowProtocolContent(!showProtocolContent)
              }}
            ></ProtocolContentBadge>

            {showProtocolContent && (
              <CodeWrapper>
                {JSON.stringify(protocol_content, null, 2)}
              </CodeWrapper>
            )}
            <Markdown
              components={{
                div: undefined,
                ul: UnnumberedListText,
                h2: HeaderText,
                li: ListItemText,
                p: ParagraphText,
                a: isUser ? ParagraphText : ExternalLink,
                code: CodeText,
              }}
            >
              {reply}
            </Markdown>
          </>
        )}

        {!isUser && !protocol_content ? (
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_FLEX_END}
            gridGap={SPACING.spacing20}
            paddingTop={SPACING.spacing12}
          >
            <HoverShadow
              onClick={() => {
                setInputFieldToCorrespondingRequest()
              }}
            >
              <StyledIcon size={SPACING.spacing20} name="reload" />
            </HoverShadow>
            <HoverShadow
              onClick={() => {
                setShowFeedbackModal(true)
              }}
            >
              <StyledIcon size={SPACING.spacing20} name="thumbs-down" />
            </HoverShadow>
            <HoverShadow
              onClick={async () => {
                await handleClickCopy()
              }}
            >
              <StyledIcon
                size={SPACING.spacing20}
                name={isCopied ? 'check' : 'content-copy'}
              />
            </HoverShadow>
            <HoverShadow
              onClick={() => {
                handleFileDownload()
              }}
            >
              <StyledIcon size={SPACING.spacing20} name="download" />
            </HoverShadow>
          </Flex>
        ) : null}
      </MessageContainer>
    </Flex>
  )
}
// Note (05/08/2024) the following styles are temp
function ExternalLink(
  props: JSX.IntrinsicAttributes & { href?: string }
): JSX.Element {
  return (
    <a
      {...props}
      style={{ color: COLORS.blue50 }}
      target="_blank"
      rel="noopener noreferrer"
    />
  )
}

function ParagraphText(props: JSX.IntrinsicAttributes): JSX.Element {
  return (
    <LegacyStyledText
      {...props}
      fontSize={TYPOGRAPHY.fontSize20}
      lineHeight={TYPOGRAPHY.lineHeight24}
      css="white-space: pre-wrap;"
    />
  )
}

function HeaderText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <LegacyStyledText {...props} as="h3" />
}

function ListItemText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <LegacyStyledText {...props} as="li" marginLeft={SPACING.spacing16} />
}

function UnnumberedListText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <LegacyStyledText {...props} as="ul" />
}

const CodeWrapper = styled(Flex)`
  display: inline-flex;
  font-family: monospace;
  padding: ${SPACING.spacing4};
  color: ${COLORS.black80};
  background-color: ${COLORS.grey20};
  border-radius: ${BORDERS.borderRadius4};
  overflow: auto;
`

const MessageContainer = styled(Flex)<{ $isUser: boolean }>`
  width: fit-content;
  max-width: 70%;
  align-self: ${props => (props.$isUser ? 'flex-end' : 'flex-start')};
`

const ContentWrapper = styled.div`
  width: 100%;
`

const AttachmentsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${SPACING.spacing8};
  flex-wrap: wrap;
`
