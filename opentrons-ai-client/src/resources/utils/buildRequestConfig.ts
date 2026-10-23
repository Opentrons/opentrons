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

import { buildMultipartFormData } from './buildMultipartFormData'
import { getUpdateOrCreatePrompt } from './protocolUtils'

import type { AxiosRequestConfig } from 'axios'
import type { ProtocolFile } from '@opentrons/shared-data'
import type {
  Chat,
  ChatMessage,
  CreatePrompt,
  ProtocolFormat,
  UpdatePrompt,
} from '/ai-client/resources/types'

type Env = 'production' | 'development' | 'staging'

interface EnvEndpoints {
  production: string
  development: string
  staging: string
}

const getEnv = (): Env =>
  _NODE_ENV_ === 'production'
    ? 'production'
    : _NODE_ENV_ === 'development'
      ? 'development'
      : 'staging'

const pickEndpoint = (endpoints: EnvEndpoints): string => endpoints[getEnv()]

const getCreateEndpoint = (): string =>
  pickEndpoint({
    production: PROD_CREATE_PROTOCOL_END_POINT,
    development: LOCAL_CREATE_PROTOCOL_END_POINT,
    staging: STAGING_CREATE_PROTOCOL_END_POINT,
  })

const getUpdateEndpoint = (): string =>
  pickEndpoint({
    production: PROD_UPDATE_PROTOCOL_END_POINT,
    development: LOCAL_UPDATE_PROTOCOL_END_POINT,
    staging: STAGING_UPDATE_PROTOCOL_END_POINT,
  })

const getChatEndpoint = (): string =>
  pickEndpoint({
    production: PROD_END_POINT,
    development: LOCAL_END_POINT,
    staging: STAGING_END_POINT,
  })

const getCreateOrUpdateEndpoint = (isNewProtocol: boolean): string => {
  return isNewProtocol ? getCreateEndpoint() : getUpdateEndpoint()
}

export const buildRequestConfig = (
  token: string,
  validatedFiles: File[],
  isUpdateOrCreateRequest: boolean,
  completeHistory: ChatMessage[],
  protocolFormat: ProtocolFormat,
  isNewProtocol: boolean,
  watchUserPrompt: string,
  chatHistory: Chat[],
  pdProtocolContent: ProtocolFile | null,
  createProtocol: CreatePrompt,
  updateProtocol: UpdatePrompt
): AxiosRequestConfig => {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  const targetEndpoint = isUpdateOrCreateRequest
    ? getCreateOrUpdateEndpoint(isNewProtocol)
    : getChatEndpoint()

  if (validatedFiles.length > 0 && !isUpdateOrCreateRequest) {
    // Multipart upload for file attachments
    const formData = buildMultipartFormData(
      completeHistory,
      validatedFiles,
      protocolFormat,
      watchUserPrompt,
      chatHistory
    )

    return {
      url: getChatEndpoint().replace('/completion', '/completion-multipart'),
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for multipart - browser sets it with boundary
      },
      data: formData,
    }
  } else {
    // Traditional JSON request (no files or update/create requests)
    const promptData = getUpdateOrCreatePrompt(
      isNewProtocol,
      createProtocol,
      updateProtocol,
      false, // isRegenerateRequest will be passed from handleClick
      protocolFormat
    )

    return {
      url: targetEndpoint,
      method: 'POST',
      headers,
      data: isUpdateOrCreateRequest
        ? promptData
        : {
            message: watchUserPrompt,
            history: completeHistory,
            fake: false,
            chatOptions: isUpdateOrCreateRequest ? 'create' : 'update',
            pdProtocolContent: pdProtocolContent,
            protocolFormat: protocolFormat,
          },
    }
  }
}
