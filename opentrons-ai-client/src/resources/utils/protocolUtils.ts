import type { CreatePrompt, ProtocolFormat, UpdatePrompt } from '../types'

/**
 * Safely parse the `protocol_content` field that may be a JSON string or an object
 */
export const parseProtocolContent = (
  content: unknown
): Record<string, unknown> => {
  let parsed: unknown
  if (content) {
    try {
      parsed = JSON.parse(content as string)
    } catch {
      parsed = {}
    }
  } else {
    parsed = {}
  }

  // Ensure result is a non-null object; otherwise fall back to {}
  return parsed != null ? (parsed as Record<string, unknown>) : {}
}

/**
 * Get the appropriate prompt for update or create operations
 */
export const getUpdateOrCreatePrompt = (
  isNewProtocol: boolean,
  createProtocol: CreatePrompt,
  updateProtocol: UpdatePrompt,
  isRegenerateRequest: boolean,
  protocolFormat?: ProtocolFormat
): CreatePrompt | UpdatePrompt => {
  createProtocol.regenerate = isRegenerateRequest
  updateProtocol.regenerate = isRegenerateRequest

  // If it's a new protocol, set the protocol_format property
  if (isNewProtocol && protocolFormat) {
    createProtocol.protocol_format = protocolFormat
  }

  return isNewProtocol ? createProtocol : updateProtocol
}

/**
 * Get prefix text for request IDs based on operation type
 */
export const getPreFixText = (
  isUpdateOrCreate: boolean,
  isNewProtocol: boolean
): string => {
  if (!isUpdateOrCreate) {
    return ''
  }

  return isNewProtocol ? 'NewProtocol' : 'UpdateProtocol'
}
