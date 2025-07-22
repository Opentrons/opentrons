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
import { useTrackEvent } from '/ai-client/resources/hooks/useTrackEvent'
import { calcTextAreaHeight } from '/ai-client/resources/utils'
import {
  getFileType,
  MAX_FILES_PER_MESSAGE,
  readFileContent,
  validateFile,
} from '/ai-client/resources/utils/fileUtils'
import { detectProtocolFormat } from '/ai-client/resources/utils/protocolFormat'

import { AttachedFileItem } from '../../atoms/AttachedFileItem'
import { AttachFileButton } from '../../atoms/AttachFileButton'
import styles from './inputprompt.module.css'

import type { AxiosRequestConfig } from 'axios'
import type { ProtocolFile } from '@opentrons/shared-data'
import type {
  ChatData,
  CreatePrompt,
  UpdatePrompt,
} from '../../resources/types'

// Helper to safely parse the `protocol_content` field that may be a JSON string or an object.
const parseProtocolContent = (content: unknown): Record<string, unknown> => {
  let parsed: unknown
  if (typeof content === 'string') {
    try {
      parsed = JSON.parse(content)
    } catch {
      parsed = {}
    }
  } else {
    parsed = content
  }

  // Ensure result is a non-null object; otherwise fall back to {}
  return parsed != null && typeof parsed === 'object'
    ? (parsed as Record<string, unknown>)
    : {}
}

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
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

  const handleFileSelect = (files: FileList): void => {
    setFileError(null)
    const fileArray = Array.from(files)

    // Check total file count
    if (attachedFiles.length + fileArray.length > MAX_FILES_PER_MESSAGE) {
      setFileError(
        `You can attach a maximum of ${MAX_FILES_PER_MESSAGE} files per message.`
      )
      return
    }

    // Validate each file
    const validFiles: File[] = []
    for (const file of fileArray) {
      const validation = validateFile(file)
      if (!validation.isValid) {
        setFileError(validation.error || 'Invalid file')
        return
      }
      validFiles.push(file)
    }

    setAttachedFiles(prev => [...prev, ...validFiles])
  }

  const handleRemoveFile = (index: number): void => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
    setFileError(null)
  }

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
    const newRequestId = uuidv4() + getPreFixText(isUpdateOrCreateRequest)
    setRequestId(newRequestId)
    const currentProtocolFormat = detectProtocolFormat(
      watchUserPrompt,
      chatHistory
    )

    // Process files locally if there are any
    const fileAttachments: any[] = []
    if (attachedFiles.length > 0 && !isUpdateOrCreateRequest) {
      try {
        for (const file of attachedFiles) {
          const fileType = getFileType(file)
          const fileContent = await readFileContent(file, fileType)
          fileAttachments.push({
            id: uuidv4(), // Generate local ID
            filename: file.name,
            file_type: fileType,
            content: fileContent.content,
            media_type: fileContent.mediaType,
            size: file.size,
          })
        }
      } catch (fileError: unknown) {
        console.error('File processing failed:', fileError)
        const errorMessage =
          fileError instanceof Error
            ? fileError.message
            : 'Failed to process files'
        setFileError(errorMessage)
        return // Don't proceed with chat if file processing fails
      }
    }

    const userInput: ChatData = {
      requestId: newRequestId,
      role: 'user',
      reply: watchUserPrompt,
      protocol_format: currentProtocolFormat,
      attachments:
        fileAttachments.length > 0
          ? fileAttachments.map(file => ({
              id: file.id,
              name: file.filename,
              type: file.file_type,
              content: file.content,
              size: file.size,
            }))
          : undefined,
    }
    reset()
    setAttachedFiles([]) // Clear attached files after sending
    setChatData(chatData => [...chatData, userInput])

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      const url = isUpdateOrCreateRequest
        ? getCreateOrUpdateEndpoint()
        : getChatEndpoint()

      const promptData = getUpdateOrCreatePrompt(isRegenerateRequest)

      // Build a history array that conforms to the server schema (role + content).
      // If this chat is dealing with a Protocol Designer conversation and a history
      // item contains a `protocol_content`, strip out `labwareDefinitions` and
      // append the remaining JSON to its content.
      const sanitizedHistory =
        currentProtocolFormat !== 'Protocol Designer'
          ? chatHistory
          : chatHistory.map(msg => {
              if (msg.protocol_content != null) {
                // Use helper to parse the protocol content into a plain object
                const rawPdJson = parseProtocolContent(msg.protocol_content)

                // Remove labwareDefinitions without using the `delete` operator
                const {
                  labwareDefinitions: _omit,
                  ...pdWithoutLabwareDefs
                } = rawPdJson

                return {
                  role: msg.role,
                  content: `${msg.content}\n\n${JSON.stringify(
                    pdWithoutLabwareDefs
                  )}`,
                }
              }

              return { role: msg.role, content: msg.content }
            })

      // Combine all attachments - new files plus files from chat history
      let attachmentsToSend: any[] | undefined = []

      // Add new files being attached
      if (fileAttachments.length > 0) {
        attachmentsToSend = [...fileAttachments]
      }

      // Add existing files from chat history (avoid duplicates by filename)
      if (chatHistory.length > 0) {
        const existingFilenames = new Set(
          attachmentsToSend.map(att => att.filename)
        )

        // Collect all unique attachments from chat history
        chatHistory.forEach(msg => {
          if (msg.attachments != null && msg.attachments.length > 0) {
            msg.attachments.forEach(att => {
              if (
                !existingFilenames.has(att.name) &&
                attachmentsToSend != null
              ) {
                attachmentsToSend.push({
                  id: att.id || '',
                  filename: att.name,
                  file_type: att.type,
                  content: att.content,
                  media_type:
                    att.type === 'csv'
                      ? 'application/json'
                      : att.type === 'python'
                      ? 'text/x-python'
                      : att.type === 'pdf'
                      ? 'application/pdf'
                      : 'text/plain',
                  size: att.size,
                })
                existingFilenames.add(att.name)
              }
            })
          }
        })
      }

      // Set to undefined if no attachments to send
      if (attachmentsToSend.length === 0) {
        attachmentsToSend = undefined
      }

      const config = {
        url,
        method: 'POST',
        headers,
        data: isUpdateOrCreateRequest
          ? promptData
          : {
              message: watchUserPrompt,
              history: sanitizedHistory,
              fake: false,
              chat_options: isUpdateOrCreateRequest ? 'create' : 'update',
              pd_protocol_content: pdProtocolContent,
              protocol_format: currentProtocolFormat,
              attachments: attachmentsToSend,
            },
      }

      setChatHistory(chatHistory => [
        ...chatHistory,
        {
          role: 'user',
          content: watchUserPrompt,
          attachments:
            fileAttachments.length > 0
              ? fileAttachments.map(file => ({
                  id: file.id,
                  name: file.filename,
                  type: file.file_type,
                  content: file.content,
                  size: file.size,
                }))
              : undefined,
        },
      ])
      await callApi(config as AxiosRequestConfig)
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

  const getUpdateOrCreatePrompt = (
    isRegenerateRequest: boolean
  ): CreatePrompt | UpdatePrompt => {
    createProtocol.regenerate = isRegenerateRequest
    updateProtocol.regenerate = isRegenerateRequest

    // If it's a new protocol, set the protocol_format property
    if (isNewProtocol) {
      createProtocol.protocol_format = detectProtocolFormat(
        createProtocol.prompt
      )
    }

    return isNewProtocol ? createProtocol : updateProtocol
  }

  const getPreFixText = (isUpdateOrCreate: boolean): string => {
    let appendCreateOrUpdate = ''
    if (isUpdateOrCreate) {
      if (isNewProtocol) {
        appendCreateOrUpdate = 'NewProtocol'
      } else {
        appendCreateOrUpdate = 'UpdateProtocol'
      }
    }
    return appendCreateOrUpdate
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
