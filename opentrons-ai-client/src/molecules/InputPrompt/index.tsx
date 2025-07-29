import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAtom } from 'jotai'
import { v4 as uuidv4 } from 'uuid'

import { COLORS, StyledText, TYPOGRAPHY } from '@opentrons/components'

import { SendButton } from '/ai-client/atoms/SendButton'
import {
  chatDataAtom,
  chatHistoryAtom,
  createProtocolChatAtom,
  regenerateProtocolAtom,
  tokenAtom,
  updateProtocolChatAtom,
} from '/ai-client/resources/atoms'
import {
  LOCAL_CREATE_PROTOCOL_END_POINT,
  LOCAL_END_POINT,
  LOCAL_UPDATE_PROTOCOL_END_POINT,
  PROD_CREATE_PROTOCOL_END_POINT,
  PROD_END_POINT,
  PROD_UPDATE_PROTOCOL_END_POINT,
  STAGING_CREATE_PROTOCOL_END_POINT,
  STAGING_END_POINT,
  STAGING_UPDATE_PROTOCOL_END_POINT,
} from '/ai-client/resources/constants'
import { useApiCall } from '/ai-client/resources/hooks'
import { useAttachFiles } from '/ai-client/resources/hooks/useAttachFiles'
import { useTrackEvent } from '/ai-client/resources/hooks/useTrackEvent'
import { calcTextAreaHeight } from '/ai-client/resources/utils'
import {
  getFileType,
  MAX_FILES_PER_MESSAGE,
} from '/ai-client/resources/utils/fileUtils'
import { detectProtocolFormat } from '/ai-client/resources/utils/protocolFormat'
import {
  getPreFixText,
  getUpdateOrCreatePrompt,
  parseProtocolContent,
} from '/ai-client/resources/utils/protocolUtils'

import { AttachedFileItem } from '../../atoms/AttachedFileItem'
import { AttachFileButton } from '../../atoms/AttachFileButton'
import styles from './inputprompt.module.css'

import type { AxiosRequestConfig } from 'axios'
import type { ProtocolFile } from '@opentrons/shared-data'
import type { FileType } from '/ai-client/resources/utils/fileUtils'
import type { ChatData } from '../../resources/types'

export function InputPrompt(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const { register, watch, reset, setValue } = useFormContext()
  const trackEvent = useTrackEvent()

  const [updateProtocol] = useAtom(updateProtocolChatAtom)
  const [createProtocol] = useAtom(createProtocolChatAtom)
  const isNewProtocol = createProtocol.prompt !== ''
  const [sendAutoFilledPrompt, setSendAutoFilledPrompt] = useState<boolean>(
    false
  )
  const [regenerateProtocol, setRegenerateProtocol] = useAtom(
    regenerateProtocolAtom
  )

  const [, setChatData] = useAtom(chatDataAtom)
  const [chatHistory, setChatHistory] = useAtom(chatHistoryAtom)
  const [token] = useAtom(tokenAtom)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const watchUserPrompt = (watch('userPrompt') ?? '') as string

  const { data, isLoading, callApi } = useApiCall()

  let pdProtocolContent: null | ProtocolFile = null
  if (data != null && typeof data === 'object' && 'protocol_content' in data) {
    pdProtocolContent = data.protocol_content as ProtocolFile
  }

  const [requestId, setRequestId] = useState<string>(uuidv4())

  // Use custom hook for file attachments
  const {
    attachedFiles,
    fileError,
    handleFileSelect,
    handleRemoveFile,
    prepareFilesForUpload,
    processFilesForHistory,
    clearFiles,
  } = useAttachFiles()

  // This is to autofill the input field for when we navigate to the chat page from the existing/new protocol generator pages
  useEffect(() => {
    const prefilledPrompt = isNewProtocol
      ? createProtocol.prompt
      : updateProtocol.prompt
    if (prefilledPrompt !== '') {
      setValue('userPrompt', prefilledPrompt)
      setSendAutoFilledPrompt(true)
    }
  }, [])

  useEffect(() => {
    if (sendAutoFilledPrompt) {
      handleClick(true)
      setSendAutoFilledPrompt(false)
    }
  }, [watchUserPrompt])

  useEffect(() => {
    if (regenerateProtocol.regenerate) {
      handleClick(regenerateProtocol.isCreateOrUpdateProtocol, true)
      setRegenerateProtocol({
        isCreateOrUpdateProtocol: false,
        regenerate: false,
      })
    }
  }, [regenerateProtocol])

  const handleClick = async (
    isUpdateOrCreateRequest: boolean = false,
    isRegenerateRequest: boolean = false
  ): Promise<void> => {
    const newRequestId =
      uuidv4() + getPreFixText(isUpdateOrCreateRequest, isNewProtocol)
    setRequestId(newRequestId)
    const currentProtocolFormat = detectProtocolFormat(
      watchUserPrompt,
      chatHistory
    )

    // Prepare files for upload - use multipart for efficiency
    let validatedFiles: File[] = []
    if (attachedFiles.length > 0 && !isUpdateOrCreateRequest) {
      try {
        validatedFiles = prepareFilesForUpload()
      } catch (fileError: unknown) {
        // Error is already set in the hook
        return // Don't proceed with chat if file validation fails
      }
    }

    const userInput: ChatData = {
      requestId: newRequestId,
      role: 'user',
      reply: watchUserPrompt,
      protocol_format: currentProtocolFormat,
      attachments:
        validatedFiles.length > 0
          ? validatedFiles.map(file => {
              const fileType = getFileType(file)
              if (!fileType) {
                throw new Error(
                  `Unexpected: validated file has no type: ${file.name}`
                )
              }
              return {
                id: uuidv4(),
                name: file.name,
                type: fileType,
                content: '', // Content will be uploaded via multipart
              }
            })
          : undefined,
    }
    reset()
    clearFiles() // Clear attached files and errors after sending
    setChatData(chatData => [...chatData, userInput])

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      const url = isUpdateOrCreateRequest
        ? getCreateOrUpdateEndpoint()
        : getChatEndpoint()

      const promptData = getUpdateOrCreatePrompt(
        isNewProtocol,
        createProtocol,
        updateProtocol,
        isRegenerateRequest,
        detectProtocolFormat(
          isNewProtocol ? createProtocol.prompt : updateProtocol.prompt
        )
      )

      // Build a complete history array that preserves file attachments in their original messages.
      // This allows the backend to construct proper conversation history with files in the right context.
      const completeHistory = chatHistory.map(msg => {
        const baseMessage = {
          role: msg.role,
          content: msg.content,
          attachments: msg.attachments || [], // Keep attachments with their original messages
        }

        // Handle Protocol Designer content if needed
        if (
          currentProtocolFormat === 'Protocol Designer' &&
          msg.protocol_content != null
        ) {
          // Use helper to parse the protocol content into a plain object
          const rawPdJson = parseProtocolContent(msg.protocol_content)

          // Extract all properties except labwareDefinitions using destructuring
          const { labwareDefinitions, ...pdWithoutLabwareDefs } = rawPdJson

          baseMessage.content = `${msg.content}\n\n${JSON.stringify(
            pdWithoutLabwareDefs
          )}`
        }

        return baseMessage
      })

      // Use multipart upload when files are attached (much more efficient)
      let config: AxiosRequestConfig

      if (validatedFiles.length > 0 && !isUpdateOrCreateRequest) {
        // Process files locally for chat history storage
        const fileAttachmentsWithContent = processFilesForHistory(
          validatedFiles
        )

        // Multipart upload for file attachments
        const formData = new FormData()
        formData.append('message', watchUserPrompt)
        formData.append('history', JSON.stringify(completeHistory)) // Send complete history with attachments
        formData.append('fake', 'false')
        formData.append('protocol_format', currentProtocolFormat)

        // Add files to FormData
        validatedFiles.forEach(file => {
          formData.append('files', file)
        })

        config = {
          url: getChatEndpoint().replace(
            '/completion',
            '/completion-multipart'
          ),
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type for multipart - browser sets it with boundary
          },
          data: formData,
        }

        // Ensure all files were processed successfully
        if (fileAttachmentsWithContent.length !== validatedFiles.length) {
          console.error('Failed to process some files for chat history')
          return
        }

        // Store processed files for chat history
        userInput.attachments = fileAttachmentsWithContent.map(file => ({
          id: file.id,
          name: file.filename,
          type: file.file_type as FileType,
          content: file.content,
        }))
      } else {
        // Traditional JSON request (no files or update/create requests)
        config = {
          url,
          method: 'POST',
          headers,
          data: isUpdateOrCreateRequest
            ? promptData
            : {
                message: watchUserPrompt,
                history: completeHistory, // Send complete history with attachments
                fake: false,
                chat_options: isUpdateOrCreateRequest ? 'create' : 'update',
                pd_protocol_content: pdProtocolContent,
                protocol_format: currentProtocolFormat,
                // No separate attachments parameter needed - they're in history now
              },
        }
      }

      await callApi(config)

      // Update chat history AFTER successful API call
      setChatHistory(chatHistory => [
        ...chatHistory,
        {
          role: 'user',
          content: watchUserPrompt,
          attachments: userInput.attachments, // Use the processed attachments with content
        },
      ])
      trackEvent({
        name: 'chat-submitted',
        properties: {
          chat: watchUserPrompt,
          protocol_format: currentProtocolFormat,
        },
      })
      setSubmitted(true)
    } catch (err: any) {
      console.error(`error: ${err.message}`)
      throw err
    }
  }

  const getCreateOrUpdateEndpoint = (): string => {
    return isNewProtocol ? getCreateEndpoint() : getUpdateEndpoint()
  }

  useEffect(() => {
    if (submitted && data != null && !isLoading) {
      const { role, reply, protocol_content } = data as ChatData
      const assistantResponse: ChatData = {
        requestId,
        role,
        reply,
        protocol_content,
      }
      setChatHistory(chatHistory => [
        ...chatHistory,
        {
          role: 'assistant',
          content: reply,
          protocol_content: (JSON.stringify(
            protocol_content
          ) as unknown) as string,
        },
      ])
      setChatData(chatData => [...chatData, assistantResponse])
      trackEvent({
        name: 'generated-protocol',
        properties: {
          createOrUpdate: isNewProtocol ? 'create' : 'update',
          protocol: reply,
        },
      })
      setSubmitted(false)
    }
  }, [data, isLoading, submitted])

  return (
    <form id="User_Prompt" className={styles.form}>
      {/* Error message */}
      {fileError && (
        <div className={styles.error_container}>
          <StyledText
            color={COLORS.red50}
            fontSize={TYPOGRAPHY.fontSizeH3}
            lineHeight={TYPOGRAPHY.lineHeight20}
          >
            {fileError}
          </StyledText>
        </div>
      )}

      {/* Main input container */}
      <div className={styles.main_input_container}>
        {/* Display attached files above the input */}
        {attachedFiles.length > 0 && (
          <div className={styles.attached_files_section}>
            <div className={styles.attached_files_list}>
              {attachedFiles.map((file, index) => (
                <AttachedFileItem
                  key={`${file.name}-${index}`}
                  file={file}
                  onRemove={() => {
                    handleRemoveFile(index)
                  }}
                  showRemoveButton={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Text input area - separate row */}
        <div className={styles.text_input_section}>
          <textarea
            rows={calcTextAreaHeight(watchUserPrompt)}
            placeholder={t('type_your_prompt')}
            className={styles.textarea}
            {...register('userPrompt')}
          />
        </div>

        {/* Bottom row with attach button and send button */}
        <div className={styles.button_row_container}>
          <AttachFileButton
            onFileSelect={handleFileSelect}
            disabled={
              isLoading || attachedFiles.length >= MAX_FILES_PER_MESSAGE
            }
          />
          <div className={styles.spacer} />
          <SendButton
            disabled={watchUserPrompt.length === 0}
            isLoading={isLoading}
            handleClick={() => {
              handleClick()
            }}
          />
        </div>
      </div>
    </form>
  )
}

const getChatEndpoint = (): string => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return PROD_END_POINT
    case 'development':
      return LOCAL_END_POINT
    default:
      return STAGING_END_POINT
  }
}

const getCreateEndpoint = (): string => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return PROD_CREATE_PROTOCOL_END_POINT
    case 'development':
      return LOCAL_CREATE_PROTOCOL_END_POINT
    default:
      return STAGING_CREATE_PROTOCOL_END_POINT
  }
}

const getUpdateEndpoint = (): string => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return PROD_UPDATE_PROTOCOL_END_POINT
    case 'development':
      return LOCAL_UPDATE_PROTOCOL_END_POINT
    default:
      return STAGING_UPDATE_PROTOCOL_END_POINT
  }
}
