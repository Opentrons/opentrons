import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { useAtom } from 'jotai'
import { v4 as uuidv4 } from 'uuid'

import { COLORS, StyledText, TYPOGRAPHY } from '@opentrons/components'

import { ANALYTICS } from '/ai-client/analytics/constants'
import { AttachedFileItem } from '/ai-client/components/atoms/AttachedFileItem'
import { AttachFileButton } from '/ai-client/components/atoms/AttachFileButton'
import { SendButton } from '/ai-client/components/atoms/SendButton'
import {
  chatDataAtom,
  chatHistoryAtom,
  createProtocolChatAtom,
  regenerateProtocolAtom,
  tokenAtom,
  updateProtocolChatAtom,
} from '/ai-client/resources/atoms'
import { useApiCall } from '/ai-client/resources/hooks'
import { useAttachFiles } from '/ai-client/resources/hooks/useAttachFiles'
import { useTrackEvent } from '/ai-client/resources/hooks/useTrackEvent'
import {
  buildChatHistory,
  buildRequestConfig,
  calcTextAreaHeight,
  createUserInput,
} from '/ai-client/resources/utils'
import { MAX_FILES_PER_MESSAGE } from '/ai-client/resources/utils/fileUtils'
import { detectProtocolFormat } from '/ai-client/resources/utils/protocolFormat'
import {
  getPreFixText,
  getUpdateOrCreatePrompt,
} from '/ai-client/resources/utils/protocolUtils'

import styles from './inputprompt.module.css'

import type { ProtocolFile } from '@opentrons/shared-data'
import type { ChatData, ProtocolFormat } from '/ai-client/resources/types'

export function InputPrompt(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const { register, watch, reset, setValue } = useFormContext()
  const trackEvent = useTrackEvent()

  const [updateProtocol] = useAtom(updateProtocolChatAtom)
  const [createProtocol] = useAtom(createProtocolChatAtom)
  const isNewProtocol = createProtocol.prompt !== ''
  const [sendAutoFilledPrompt, setSendAutoFilledPrompt] =
    useState<boolean>(false)
  const [regenerateProtocol, setRegenerateProtocol] = useAtom(
    regenerateProtocolAtom
  )

  const [, setChatData] = useAtom(chatDataAtom)
  const [chatHistory, setChatHistory] = useAtom(chatHistoryAtom)
  const [token] = useAtom(tokenAtom)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const watchUserPrompt = (watch('userPrompt') ?? '') as string

  const { data, isLoading, callApi, error } = useApiCall()

const pdProtocolContent = useMemo(() => {
  if (data != null && typeof data === 'object' && 'protocol_content' in data) {
    return data.protocol_content as ProtocolFile
  }
  return null
}, [data])

  const [requestId, setRequestId] = useState<string>(uuidv4())

  const {
    attachedFiles,
    fileError,
    handleFileSelect,
    handleRemoveFile,
    prepareFilesForUpload,
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
      void handleClick(true)
      setSendAutoFilledPrompt(false)
    }
  }, [sendAutoFilledPrompt])

  useEffect(() => {
    if (regenerateProtocol.regenerate) {
      void handleClick(regenerateProtocol.isCreateOrUpdateProtocol, true)
      setRegenerateProtocol({
        isCreateOrUpdateProtocol: false,
        regenerate: false,
      })
    }
  }, [regenerateProtocol])

  const prepareValidatedFiles = (
    isUpdateOrCreateRequest: boolean
  ): File[] | null => {
    if (attachedFiles.length === 0 || isUpdateOrCreateRequest) {
      return []
    }

    const files = prepareFilesForUpload()
    if (files === null) {
      return null // Validation failed, error already shown to user
    }
    return files
  }

  const handleSuccessfulSubmission = (
    userInput: ChatData,
    protocolFormat: ProtocolFormat
  ): void => {
    setChatHistory(chatHistory => [
      ...chatHistory,
      {
        role: 'user',
        content: watchUserPrompt,
        attachments: userInput.attachments, // Use the processed attachments with content
      },
    ])
    trackEvent({
      name: ANALYTICS.CHAT_SUBMITTED,
      properties: {
        chat: watchUserPrompt,
        protocol_format: protocolFormat,
      },
    })
    setSubmitted(true)
  }

  const handleClick = async (
    isUpdateOrCreateRequest: boolean = false,
    isRegenerateRequest: boolean = false
  ): Promise<void> => {
    const newRequestId = `${uuidv4()}${getPreFixText(
      isUpdateOrCreateRequest,
      isNewProtocol
    )}`
    setRequestId(newRequestId)
    const currentProtocolFormat = detectProtocolFormat(
      watchUserPrompt,
      chatHistory
    )

    // Prepare files for upload
    const validatedFiles = prepareValidatedFiles(isUpdateOrCreateRequest)
    if (validatedFiles === null) {
      return // Validation failed, error already shown to user
    }

    // Create user input data
    const userInput = createUserInput(
      newRequestId,
      currentProtocolFormat,
      validatedFiles,
      watchUserPrompt
    )

    // Clear form and update state
    reset()
    clearFiles()
    setChatData(chatData => [...chatData, userInput])

    // Build complete chat history for API
    const completeHistory = buildChatHistory(chatHistory, currentProtocolFormat)

    // Build request configuration
    const config = buildRequestConfig(
      token,
      validatedFiles,
      isUpdateOrCreateRequest,
      completeHistory,
      currentProtocolFormat,
      isNewProtocol,
      watchUserPrompt,
      chatHistory,
      pdProtocolContent,
      createProtocol,
      updateProtocol
    )

    // Handle regenerate request for traditional JSON requests
    if (isRegenerateRequest && validatedFiles.length === 0) {
      const promptData = getUpdateOrCreatePrompt(
        isNewProtocol,
        createProtocol,
        updateProtocol,
        isRegenerateRequest,
        detectProtocolFormat(
          isNewProtocol ? createProtocol.prompt : updateProtocol.prompt
        )
      )
      if (isUpdateOrCreateRequest && config.data !== promptData) {
        config.data = promptData
      }
    }

    await callApi(config)
    handleSuccessfulSubmission(userInput, currentProtocolFormat)
  }

  useEffect(() => {
    if (submitted && !isLoading) {
      if (error) {
        // Error occurred - reset submitted state to allow retry
        setSubmitted(false)
      } else if (data != null) {
        // Success - process the response
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
            protocol_content: JSON.stringify(
              protocol_content
            ) as unknown as string,
          },
        ])
        setChatData(chatData => [...chatData, assistantResponse])
        trackEvent({
          name: ANALYTICS.GENERATED_PROTOCOL,
          properties: {
            createOrUpdate: isNewProtocol ? 'create' : 'update',
            protocol: reply,
          },
        })
        setSubmitted(false)
      }
    }
  }, [data, isLoading, submitted, error])

  return (
    <form id="User_Prompt" className={styles.form}>
      {/* Error message */}
      {(fileError || error) && (
        <div className={styles.error_container}>
          <StyledText
            color={COLORS.red50}
            fontSize={TYPOGRAPHY.fontSizeH3}
            lineHeight={TYPOGRAPHY.lineHeight20}
          >
            {fileError || error}
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
        <div
          className={clsx(
            styles.text_input_section,
            attachedFiles.length === 0 && styles.text_input_section_no_files
          )}
        >
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
              void handleClick()
            }}
          />
        </div>
      </div>
    </form>
  )
}
