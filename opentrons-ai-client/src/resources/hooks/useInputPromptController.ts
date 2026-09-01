import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAtom } from 'jotai'
import { v4 as uuidv4 } from 'uuid'

import { ANALYTICS } from '/ai-client/analytics/constants'
import {
  chatDataAtom,
  chatHistoryAtom,
  createProtocolChatAtom,
  regenerateProtocolAtom,
  updateProtocolChatAtom,
} from '/ai-client/resources/atoms'
import { useApiCall } from '/ai-client/resources/hooks'
import { useAttachFiles } from '/ai-client/resources/hooks/useAttachFiles'
import { useGetAccessToken } from '/ai-client/resources/hooks/useGetAccessToken'
import { useTrackEvent } from '/ai-client/resources/hooks/useTrackEvent'
import {
  buildChatHistory,
  buildRequestConfig,
  createUserInput,
  resolveErrorMessage,
} from '/ai-client/resources/utils'
import {
  getPreFixText,
  getUpdateOrCreatePrompt,
} from '/ai-client/resources/utils/protocolUtils'

import type { TFunction } from 'i18next'
import type { ProtocolFile } from '@opentrons/shared-data'
import type { ChatData, ProtocolFormat } from '/ai-client/resources/types'

interface UseInputPromptControllerArgs {
  userPrompt: string
  resetForm: () => void
  setUserPrompt: (value: string) => void
}

interface UseInputPromptControllerResult {
  submitChat: () => void
  isLoading: boolean
  errorMessage: string | null
  dismissError: () => void
  attachedFiles: File[]
  handleFileSelect: (files: FileList | null) => void
  handleRemoveFile: (index: number) => void
}

export function useInputPromptController(
  args: UseInputPromptControllerArgs
): UseInputPromptControllerResult {
  const { userPrompt, resetForm, setUserPrompt } = args

  const { t } = useTranslation('protocol_generator')
  const trackEvent = useTrackEvent()

  const [updateProtocol] = useAtom(updateProtocolChatAtom)
  const [createProtocol] = useAtom(createProtocolChatAtom)
  const isNewProtocol = createProtocol.prompt !== ''

  const [regenerateProtocol, setRegenerateProtocol] = useAtom(
    regenerateProtocolAtom
  )

  const [, setChatData] = useAtom(chatDataAtom)
  const [chatHistory, setChatHistory] = useAtom(chatHistoryAtom)
  const { getAccessToken } = useGetAccessToken()

  const [sendAutoFilledPrompt, setSendAutoFilledPrompt] =
    useState<boolean>(false)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [requestId, setRequestId] = useState<string>(uuidv4())

  const { data, isLoading, callApi, error, clearError } = useApiCall()

  const pdProtocolContent: null | ProtocolFile = useMemo(() => {
    if (data != null && typeof data === 'object' && 'protocolContent' in data) {
      return (data as any).protocolContent as ProtocolFile
    }
    return null
  }, [data])

  const {
    attachedFiles,
    fileError,
    handleFileSelect: handleFileSelectRaw,
    handleRemoveFile,
    prepareFilesForUpload,
    clearFiles,
  } = useAttachFiles()

  useEffect(
    () => {
      const prefilledPrompt = isNewProtocol
        ? createProtocol.prompt
        : updateProtocol.prompt

      if (prefilledPrompt !== '') {
        setUserPrompt(prefilledPrompt)
        setSendAutoFilledPrompt(true)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(
    () => {
      if (sendAutoFilledPrompt) {
        void handleClick(true)
        setSendAutoFilledPrompt(false)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sendAutoFilledPrompt]
  )

  useEffect(
    () => {
      if (regenerateProtocol.regenerate) {
        void handleClick(regenerateProtocol.isCreateOrUpdateProtocol, true)
        setRegenerateProtocol({
          isCreateOrUpdateProtocol: false,
          regenerate: false,
        })
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [regenerateProtocol]
  )

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
    setChatHistory(prev => [
      ...prev,
      {
        role: 'user',
        content: userPrompt,
        attachments: userInput.attachments,
      },
    ])

    trackEvent({
      name: ANALYTICS.CHAT_SUBMITTED,
      properties: {
        chat: userPrompt,
        protocolFormat: protocolFormat,
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

    // PD protocol format was removed in AUTH-2850; the app only generates Python protocols now.
    const currentProtocolFormat: ProtocolFormat = 'Python'

    const validatedFiles = prepareValidatedFiles(isUpdateOrCreateRequest)
    if (validatedFiles === null) return

    let token: string
    try {
      token = await getAccessToken()
    } catch {
      return
    }

    const userInput = createUserInput(
      newRequestId,
      currentProtocolFormat,
      validatedFiles,
      userPrompt
    )

    // Clear form and update state
    resetForm()
    clearFiles()
    setChatData(prev => [...prev, userInput])

    const completeHistory = buildChatHistory(chatHistory, currentProtocolFormat)

    const config = buildRequestConfig(
      token,
      validatedFiles,
      isUpdateOrCreateRequest,
      completeHistory,
      currentProtocolFormat,
      isNewProtocol,
      userPrompt,
      chatHistory,
      pdProtocolContent,
      createProtocol,
      updateProtocol
    )

    // Regenerate request for traditional JSON requests (no files)
    if (isRegenerateRequest && validatedFiles.length === 0) {
      const promptData = getUpdateOrCreatePrompt(
        isNewProtocol,
        createProtocol,
        updateProtocol,
        isRegenerateRequest,
        currentProtocolFormat
      )
      if (isUpdateOrCreateRequest && config.data !== promptData) {
        ;(config as any).data = promptData
      }
    }

    await callApi(config)
    handleSuccessfulSubmission(userInput, currentProtocolFormat)
  }

  // Process API response
  useEffect(() => {
    if (submitted && !isLoading) {
      if (error != null) {
        setSubmitted(false)
      } else if (data != null) {
        const { role, reply, protocolContent } = data as ChatData
        const assistantResponse: ChatData = {
          requestId,
          role,
          reply,
          protocolContent,
        }

        setChatHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: reply,
            protocolContent: JSON.stringify(
              protocolContent
            ) as unknown as string,
          },
        ])

        setChatData(prev => [...prev, assistantResponse])

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
  }, [
    data,
    isLoading,
    submitted,
    error,
    requestId,
    isNewProtocol,
    trackEvent,
    setChatData,
    setChatHistory,
  ])

  const errorMessage: string | null =
    fileError ?? resolveErrorMessage(error, t as TFunction)

  return {
    submitChat: () => {
      void handleClick(false, false)
    },
    isLoading,
    errorMessage,
    dismissError: clearError,
    attachedFiles,
    handleFileSelect: (files: FileList | null) => {
      if (files == null) return
      handleFileSelectRaw(files)
    },
    handleRemoveFile,
  }
}
