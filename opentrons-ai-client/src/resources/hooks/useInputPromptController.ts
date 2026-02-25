import { useEffect, useMemo, useState } from 'react'
import { useAtom } from 'jotai'
import { v4 as uuidv4 } from 'uuid'

import { ANALYTICS } from '/ai-client/analytics/constants'
import {
  chatDataAtom,
  chatHistoryAtom,
  createProtocolChatAtom,
  featureFlagsAtom,
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
  createUserInput,
  getCompletionMultipartStreamEndpoint,
  getCompletionStreamEndpoint,
  getCreateStreamEndpoint,
  getUpdateStreamEndpoint,
  streamChatApi,
} from '/ai-client/resources/utils'
import { detectProtocolFormat } from '/ai-client/resources/utils/protocolFormat'
import {
  getPreFixText,
  getUpdateOrCreatePrompt,
} from '/ai-client/resources/utils/protocolUtils'

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
  attachedFiles: File[]
  handleFileSelect: (files: FileList | null) => void
  handleRemoveFile: (index: number) => void
}

export function useInputPromptController(
  args: UseInputPromptControllerArgs
): UseInputPromptControllerResult {
  const { userPrompt, resetForm, setUserPrompt } = args

  const trackEvent = useTrackEvent()

  const [updateProtocol] = useAtom(updateProtocolChatAtom)
  const [createProtocol] = useAtom(createProtocolChatAtom)
  const isNewProtocol = createProtocol.prompt !== ''

  const [regenerateProtocol, setRegenerateProtocol] = useAtom(
    regenerateProtocolAtom
  )

  const [, setChatData] = useAtom(chatDataAtom)
  const [chatHistory, setChatHistory] = useAtom(chatHistoryAtom)
  const [token] = useAtom(tokenAtom)
  const [featureFlags] = useAtom(featureFlagsAtom)

  const [sendAutoFilledPrompt, setSendAutoFilledPrompt] =
    useState<boolean>(false)
  const [submitted, setSubmitted] = useState<boolean>(false)
  const [requestId, setRequestId] = useState<string>(uuidv4())
  const [isStreaming, setIsStreaming] = useState<boolean>(false)
  const [streamingError, setStreamingError] = useState<string | null>(null)

  const { data, isLoading, error } = useApiCall()

  const pdProtocolContent: null | ProtocolFile = useMemo(() => {
    if (
      data != null &&
      typeof data === 'object' &&
      'protocol_content' in data
    ) {
      return (data as any).protocol_content as ProtocolFile
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

  useEffect(() => {
    const prefilledPrompt = isNewProtocol
      ? createProtocol.prompt
      : updateProtocol.prompt

    if (prefilledPrompt !== '') {
      setUserPrompt(prefilledPrompt)
      setSendAutoFilledPrompt(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (sendAutoFilledPrompt) {
      void handleClick(true)
      setSendAutoFilledPrompt(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendAutoFilledPrompt])

  useEffect(() => {
    if (regenerateProtocol.regenerate) {
      void handleClick(regenerateProtocol.isCreateOrUpdateProtocol, true)
      setRegenerateProtocol({
        isCreateOrUpdateProtocol: false,
        regenerate: false,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const currentProtocolFormat = detectProtocolFormat(userPrompt, chatHistory)

    const validatedFiles = prepareValidatedFiles(isUpdateOrCreateRequest)
    if (validatedFiles === null) return

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
        detectProtocolFormat(
          isNewProtocol ? createProtocol.prompt : updateProtocol.prompt
        )
      )
      if (isUpdateOrCreateRequest && config.data !== promptData) {
        ;(config as any).data = promptData
      }
    }

    // Update-protocol (no files): call update stream endpoint
    const isUpdateStream =
      isUpdateOrCreateRequest && !isNewProtocol && validatedFiles.length === 0
    if (isUpdateStream) {
      handleSuccessfulSubmission(userInput, currentProtocolFormat)
      setChatData(prev => [
        ...prev,
        {
          requestId: newRequestId,
          role: 'assistant',
          reply: '',
        },
      ])
      setStreamingError(null)
      setIsStreaming(true)
      const streamUrl = getUpdateStreamEndpoint()
      const headers: Record<string, string> = {
        ...(config.headers as Record<string, string>),
        'x-enable-analytics': (featureFlags.enableAnalytics ?? true).toString(),
      }
      await streamChatApi(
        streamUrl,
        {
          method: config.method ?? 'POST',
          headers,
          body: JSON.stringify(config.data),
        },
        {
          onDelta: accumulated => {
            setChatData(prev =>
              prev.map(c =>
                c.requestId === newRequestId && c.role === 'assistant'
                  ? { ...c, reply: accumulated }
                  : c
              )
            )
          },
          onDone: reply => {
            setChatHistory(prev => [
              ...prev,
              {
                role: 'assistant',
                content: reply,
                protocol_content: undefined,
              },
            ])
            setChatData(prev =>
              prev.map(c =>
                c.requestId === newRequestId && c.role === 'assistant'
                  ? { ...c, reply }
                  : c
              )
            )
            trackEvent({
              name: ANALYTICS.GENERATED_PROTOCOL,
              properties: {
                createOrUpdate: 'update',
                protocol: reply,
              },
            })
            setSubmitted(false)
            setIsStreaming(false)
          },
          onError: err => {
            setStreamingError(err.message)
            setIsStreaming(false)
            setSubmitted(false)
            setChatData(prev =>
              prev.filter(
                c => !(c.requestId === newRequestId && c.role === 'assistant')
              )
            )
          },
        }
      )
      return
    }

    const runStreamingFlow = async (
      streamUrl: string,
      body: string | FormData
    ): Promise<void> => {
      handleSuccessfulSubmission(userInput, currentProtocolFormat)
      setChatData(prev => [
        ...prev,
        {
          requestId: newRequestId,
          role: 'assistant',
          reply: '',
        },
      ])
      setStreamingError(null)
      setIsStreaming(true)
      const headers: Record<string, string> = {
        ...(config.headers as Record<string, string>),
        'x-enable-analytics': (featureFlags.enableAnalytics ?? true).toString(),
      }
      if (typeof body === 'string') {
        headers['Content-Type'] = 'application/json'
      }
      await streamChatApi(
        streamUrl,
        {
          method: config.method ?? 'POST',
          headers,
          body,
        },
        {
          onDelta: accumulated => {
            setChatData(prev =>
              prev.map(c =>
                c.requestId === newRequestId && c.role === 'assistant'
                  ? { ...c, reply: accumulated }
                  : c
              )
            )
          },
          onDone: reply => {
            setChatHistory(prev => [
              ...prev,
              {
                role: 'assistant',
                content: reply,
                protocol_content: undefined,
              },
            ])
            setChatData(prev =>
              prev.map(c =>
                c.requestId === newRequestId && c.role === 'assistant'
                  ? { ...c, reply }
                  : c
              )
            )
            trackEvent({
              name: ANALYTICS.GENERATED_PROTOCOL,
              properties: {
                createOrUpdate: isNewProtocol ? 'create' : 'update',
                protocol: reply,
              },
            })
            setSubmitted(false)
            setIsStreaming(false)
          },
          onError: err => {
            setStreamingError(err.message)
            setIsStreaming(false)
            setSubmitted(false)
            setChatData(prev =>
              prev.filter(
                c => !(c.requestId === newRequestId && c.role === 'assistant')
              )
            )
          },
        }
      )
    }

    const isCreateStream =
      isUpdateOrCreateRequest && isNewProtocol && validatedFiles.length === 0
    if (isCreateStream) {
      await runStreamingFlow(
        getCreateStreamEndpoint(),
        JSON.stringify(config.data)
      )
      return
    }

    const isCompletionStream =
      !isUpdateOrCreateRequest && validatedFiles.length === 0
    if (isCompletionStream) {
      await runStreamingFlow(
        getCompletionStreamEndpoint(),
        JSON.stringify(config.data)
      )
      return
    }

    const isCompletionMultipartStream =
      !isUpdateOrCreateRequest && validatedFiles.length > 0
    if (isCompletionMultipartStream) {
      await runStreamingFlow(
        getCompletionMultipartStreamEndpoint(),
        config.data as FormData
      )
      return
    }

    // This path is not reachable through the current UI: update/create pages have no file
    // attachment UI, so isUpdateOrCreateRequest with validatedFiles > 0 cannot be triggered.
    // If that ever changes, a streaming endpoint should be added rather than falling back here.
    console.error('Unexpected non-streaming path reached', {
      isUpdateOrCreateRequest,
      validatedFilesLength: validatedFiles.length,
    })
  }

  // Process API response
  useEffect(() => {
    if (submitted && !isLoading) {
      if (error != null) {
        setSubmitted(false)
      } else if (data != null) {
        const {
          role,
          reply,
          protocol_content: protocolContent,
        } = data as ChatData
        const assistantResponse: ChatData = {
          requestId,
          role,
          reply,
          protocol_content: protocolContent,
        }

        setChatHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: reply,
            protocol_content: JSON.stringify(
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

  const formatError = (err: unknown): string | null => {
    if (err == null) return null
    if (typeof err === 'string') return err
    return String(err)
  }

  const errorMessage: string | null =
    fileError ?? streamingError ?? formatError(error)

  return {
    submitChat: () => {
      void handleClick(false, false)
    },
    isLoading: isLoading || isStreaming,
    errorMessage,
    attachedFiles,
    handleFileSelect: (files: FileList | null) => {
      if (files == null) return
      handleFileSelectRaw(files)
    },
    handleRemoveFile,
  }
}
