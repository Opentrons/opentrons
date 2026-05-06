import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { useAtom } from 'jotai'
import delay from 'lodash/delay'

import {
  Icon,
  Link,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  WHITE_SPACE_PRE_WRAP,
} from '@opentrons/components'

import smallLogo from '/ai-client/assets/images/opentrons_logo_small.svg'
import { AttachedFileItem } from '/ai-client/components/atoms/AttachedFileItem'
import { EnhancedMarkdown } from '/ai-client/components/molecules/EnhancedMarkdown'
import {
  chatDataAtom,
  createProtocolChatAtom,
  feedbackModalAtom,
  regenerateProtocolAtom,
  scrollToBottomAtom,
  updateProtocolChatAtom,
} from '/ai-client/resources/atoms'
import { useTrackEvent } from '/ai-client/resources/hooks/useTrackEvent'

import styles from './chatdisplay.module.css'

import type { ChatData } from '/ai-client/resources/types'

interface ChatDisplayProps {
  chat: ChatData
  chatId: string
}

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
  const { role, reply, requestId, protocolContent, attachments } = chat
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
    if (protocolContent != null) {
      const blob = new Blob([JSON.stringify(protocolContent, null, 2)], {
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
    if (code === '') {
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
    if (protocolContent != null) {
      await navigator.clipboard.writeText(JSON.stringify(protocolContent))
    } else {
      // Copy the entire OpentronsAI response content including markdown and code blocks
      await navigator.clipboard.writeText(reply)
    }

    setIsCopied(true)
    trackEvent({
      name: 'copy-protocol',
      properties: {},
    })
  }

  useEffect(() => {
    if (isCopied) {
      delay(() => {
        setIsCopied(false)
      }, 2000)
    }
  }, [isCopied])

  const protocolName =
    chatdata.findLast(chat => chat.protocolContent != null)?.protocolContent
      ?.metadata.protocolName ?? 'protocol.json'

  // ToDo this nested component definition should be resolved
  // eslint-disable-next-line @eslint-react/no-nested-component-definitions
  const ProtocolContentBadge = (props: {
    onClick: () => void
  }): JSX.Element => {
    const { onClick } = props
    return (
      <div className={styles.outer_container}>
        <div className={styles.file_container} onClick={onClick}>
          <div className={styles.badge_container}>
            <div className={styles.icon_wrapper}>
              <img
                src={smallLogo}
                alt="Opentrons logo"
                width="24px"
                height="24px"
              />
            </div>
            <span className={styles.file_name}>{protocolName}</span>
          </div>

          <div className={styles.button_container}>
            <div
              className={styles.hover_shadow}
              onClick={e => {
                e.stopPropagation()
                setShowFeedbackModal(true)
              }}
            >
              <Icon
                size={SPACING.spacing20}
                name="thumbs-down"
                className={styles.styled_icon}
              />
            </div>
            <div
              className={styles.hover_shadow}
              onClick={e => {
                e.stopPropagation()
                void handleClickCopy()
              }}
            >
              <Icon
                size={SPACING.spacing20}
                name={isCopied ? 'check' : 'content-copy'}
                className={styles.styled_icon}
              />
            </div>
            <div
              className={styles.hover_shadow}
              onClick={e => {
                e.stopPropagation()
                handleFileDownload()
              }}
            >
              <Icon
                size={SPACING.spacing20}
                name="download"
                className={styles.styled_icon}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.main_container}>
      <div
        className={`${styles.header_container} ${
          isUser ? styles.header_container_user : styles.header_container_ai
        }`}
      >
        <StyledText paddingTop={SPACING.spacing12}>
          {isUser ? t('you') : t('opentronsai')}
        </StyledText>
      </div>
      {/* text should be markdown so this component will have a package or function to parse markdown */}
      <div
        className={clsx(
          styles.message_container,
          isUser ? styles.message_container_user : styles.message_container_ai
        )}
        data-testid={`ChatDisplay_from_${isUser ? 'user' : 'backend'}`}
      >
        {protocolContent == null && (
          <div className={styles.content_wrapper}>
            <EnhancedMarkdown content={reply} />
          </div>
        )}

        {/* Display file attachments for user messages */}
        {isUser && attachments != null && attachments.length > 0 && (
          <div className={styles.attachments_container}>
            {attachments.map((attachment, index) => (
              <AttachedFileItem
                key={`${attachment.name}-${index}`}
                file={attachment}
                showRemoveButton={false}
              />
            ))}
          </div>
        )}
        {protocolContent != null && (
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
              <Icon
                name="open-in-new"
                size="1.125rem"
                className={`${styles.styled_icon} ${styles.open_in_new_icon}`}
              />
            </Link>
          </StyledText>
        )}

        {/* Display protocol_content badge and content */}
        {!isUser && protocolContent != null && (
          <>
            <ProtocolContentBadge
              onClick={() => {
                setShowProtocolContent(!showProtocolContent)
              }}
            ></ProtocolContentBadge>

            {showProtocolContent && (
              <div className={styles.code_wrapper}>
                {JSON.stringify(protocolContent, null, 2)}
              </div>
            )}
            <EnhancedMarkdown content={reply} />
          </>
        )}

        {!isUser && protocolContent == null ? (
          <div className={styles.actions_container}>
            <div
              className={styles.hover_shadow}
              onClick={() => {
                setInputFieldToCorrespondingRequest()
              }}
            >
              <Icon
                size={SPACING.spacing20}
                name="reload"
                className={styles.styled_icon}
              />
            </div>
            <div
              className={styles.hover_shadow}
              onClick={() => {
                setShowFeedbackModal(true)
              }}
            >
              <Icon
                size={SPACING.spacing20}
                name="thumbs-down"
                className={styles.styled_icon}
              />
            </div>
            <div
              className={styles.hover_shadow}
              onClick={() => {
                void handleClickCopy()
              }}
            >
              <Icon
                size={SPACING.spacing20}
                name={isCopied ? 'check' : 'content-copy'}
                className={styles.styled_icon}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
// Note (05/08/2024) the following styles are temp
function ExternalLink(
  props: JSX.IntrinsicAttributes & { href?: string }
): JSX.Element {
  return (
    <a
      {...props}
      className={styles.external_link}
      target="_blank"
      rel="noopener noreferrer"
    />
  )
}
