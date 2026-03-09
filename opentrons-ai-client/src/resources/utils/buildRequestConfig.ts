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
import { detectProtocolFormat } from './protocolFormat'
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

const getCreateEndpoint = (): string => {
  switch (_NODE_ENV_) {
    case 'production':
      return PROD_CREATE_PROTOCOL_END_POINT
    case 'development':
      return LOCAL_CREATE_PROTOCOL_END_POINT
    default:
      return STAGING_CREATE_PROTOCOL_END_POINT
  }
}

const getUpdateEndpoint = (): string => {
  switch (_NODE_ENV_) {
    case 'production':
      return PROD_UPDATE_PROTOCOL_END_POINT
    case 'development':
      return LOCAL_UPDATE_PROTOCOL_END_POINT
    default:
      return STAGING_UPDATE_PROTOCOL_END_POINT
  }
}

const getChatEndpoint = (): string => {
  switch (_NODE_ENV_) {
    case 'production':
      return PROD_END_POINT
    case 'development':
      return LOCAL_END_POINT
    default:
      return STAGING_END_POINT
  }
}

const getCreateOrUpdateEndpoint = (isNewProtocol: boolean): string => {
  return isNewProtocol ? getCreateEndpoint() : getUpdateEndpoint()
}

export const buildRequestConfig = (
  token: string | null,
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
      detectProtocolFormat(
        isNewProtocol ? createProtocol.prompt : updateProtocol.prompt
      )
    )

    return {
      url: targetEndpoint,
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
            protocol_format: protocolFormat,
            // No separate attachments parameter needed - they're in history now
          },
    }
  }
}
