import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useAtom } from 'jotai'
import styled, { css } from 'styled-components'
import { v4 as uuidv4 } from 'uuid'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

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
import { detectProtocolFormat } from '/ai-client/resources/utils/protocolFormat'

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
    const userInput: ChatData = {
      requestId: newRequestId,
      role: 'user',
      reply: watchUserPrompt,
      protocol_format: currentProtocolFormat,
    }
    reset()
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
            },
      }

      setChatHistory(chatHistory => [
        ...chatHistory,
        { role: 'user', content: watchUserPrompt },
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
    <StyledForm id="User_Prompt">
      <Flex css={CONTAINER_STYLE}>
        <LegacyStyledTextarea
          rows={calcTextAreaHeight(watchUserPrompt)}
          placeholder={t('type_your_prompt')}
          {...register('userPrompt')}
        />
        <SendButton
          disabled={watchUserPrompt.length === 0}
          isLoading={isLoading}
          handleClick={() => {
            handleClick()
          }}
        />
      </Flex>
    </StyledForm>
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

const StyledForm = styled.form`
  width: 100%;
`

const CONTAINER_STYLE = css`
  padding: ${SPACING.spacing40};
  grid-gap: ${SPACING.spacing40};
  flex-direction: ${DIRECTION_ROW};
  background-color: ${COLORS.white};
  border-radius: ${BORDERS.borderRadius4};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  max-height: 21.25rem;

  &:focus-within {
    border: 1px ${BORDERS.styleSolid}${COLORS.blue50};
  }
`

const LegacyStyledTextarea = styled.textarea`
  resize: none;
  min-height: 3.75rem;
  max-height: 17.25rem;
  overflow-y: auto;
  background-color: ${COLORS.white};
  border: none;
  outline: none;
  padding: 0;
  box-shadow: none;
  color: ${COLORS.black90};
  width: 100%;
  font-size: ${TYPOGRAPHY.fontSize20};
  line-height: ${TYPOGRAPHY.lineHeight24};
  padding: 1.2rem 0;
  font-size: 1rem;

  ::placeholder {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
`
